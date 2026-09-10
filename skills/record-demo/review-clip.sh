#!/usr/bin/env bash
# Gate a demo clip before it goes on an MR. Fails loudly when the clip has the
# shape that bores a reviewer: long frozen runs, unexplained screens, too long.
#
# Usage: review-clip.sh <clip.mp4|webm> [--max-seconds N] [--max-frozen-pct N] [--max-run-seconds N]
#
# Writes <clip>.contact.png (timestamped frame every 3s) next to the clip. Look
# at it. If two neighbouring tiles are identical, that stretch is dead time.
#
# Thresholds are deliberately loose. A clip that trips them is not borderline.
set -euo pipefail

clip="${1:?usage: review-clip.sh <clip> [--max-seconds N] [--max-frozen-pct N] [--max-run-seconds N]}"
shift
max_seconds=45; max_frozen_pct=40; max_run=5
while [ $# -gt 0 ]; do
  case "$1" in
    --max-seconds) max_seconds="$2"; shift 2 ;;
    --max-frozen-pct) max_frozen_pct="$2"; shift 2 ;;
    --max-run-seconds) max_run="$2"; shift 2 ;;
    *) echo "unknown flag: $1" >&2; exit 2 ;;
  esac
done
[ -f "$clip" ] || { echo "no such file: $clip" >&2; exit 2; }
command -v ffmpeg >/dev/null || { echo "ffmpeg not installed" >&2; exit 2; }

dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$clip")
dur_i=${dur%.*}

# Frozen runs: frames that do not change for >= 1.5s, at a noise floor that
# ignores compression jitter but catches a static page.
frozen=$(ffmpeg -loglevel info -i "$clip" -vf "freezedetect=n=-60dB:d=1.5" -f null - 2>&1 \
  | grep -oE "freeze_duration: [0-9.]+" | awk '{print $2}')
frozen_total=$(printf '%s\n' "$frozen" | awk '{t+=$1} END{printf "%.1f", t+0}')
frozen_max=$(printf '%s\n' "$frozen" | awk 'BEGIN{m=0}{if($1>m)m=$1} END{printf "%.1f", m}')
frozen_pct=$(awk -v t="$frozen_total" -v d="$dur" 'BEGIN{printf "%.0f", (d>0? t/d*100 : 0)}')

# Contact sheet, one tile every 3s, timestamp burned in.
sheet="${clip%.*}.contact.png"
cols=6; rows=$(( (dur_i / 3 + cols) / cols ))
# fc-match can return a bare filename; drawtext needs an absolute path.
font=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf
[ -f "$font" ] || font=$(fc-list 2>/dev/null | grep -i 'Bold' | head -1 | cut -d: -f1)
fontopt=""; [ -f "$font" ] && fontopt="fontfile=${font}:"
ffmpeg -y -loglevel error -i "$clip" \
  -vf "fps=1/3,scale=320:-1,drawtext=${fontopt}text='%{pts\:hms}':x=6:y=6:fontsize=18:fontcolor=yellow:box=1:boxcolor=black@0.6,tile=${cols}x${rows}" \
  "$sheet"

fail=0
check() { # name, value, failed(0/1), limit-text
  local status="ok"; if [ "$3" = 1 ]; then status="FAIL"; fail=1; fi
  printf '  %-28s %-14s %-5s %s\n' "$1" "$2" "$status" "$4"
}
echo "review-clip: $clip"
echo "  contact sheet: $sheet"

r=0; awk -v d="$dur" -v m="$max_seconds" 'BEGIN{exit !(d>m)}' && r=1
check "length" "${dur%.*}s" "$r" "(limit ${max_seconds}s)"
r=0; [ "$frozen_pct" -gt "$max_frozen_pct" ] && r=1
check "frozen frames" "${frozen_total}s = ${frozen_pct}%" "$r" "(limit ${max_frozen_pct}%)"
r=0; awk -v x="$frozen_max" -v m="$max_run" 'BEGIN{exit !(x>m)}' && r=1
check "longest frozen run" "${frozen_max}s" "$r" "(limit ${max_run}s)"

if [ "$fail" = 1 ]; then
  echo "verdict: FAIL. Do not upload. Open the contact sheet and cut the dead time."
  exit 1
fi
echo "verdict: pass"
