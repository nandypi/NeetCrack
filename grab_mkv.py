#!/usr/bin/env python3
r"""
grab_mkv.py — download the HIGHEST-quality Vimeo video as a lossless .mkv.

Inputs:  VideoID, Hash, FileName, [Destination]
         Destination defaults to this script's folder if not given.

Run examples (Command Prompt / PowerShell):
    python grab_mkv.py 741856436 5426746fca "lesson_01"
    python grab_mkv.py 741856436 5426746fca "lesson_01" -d "D:\courses\neetcode"
"""
import argparse
import subprocess
import sys
from pathlib import Path

# ─── EDIT THESE TWO IF NEEDED ────────────────────────────────────────────
# Path to ffmpeg.exe. Relative paths are resolved from this script's folder.
FFMPEG_PATH = r"ffmpeg-8.1.2-essentials_build/bin/ffmpeg.exe"

# The site the video is embedded on (unlocks domain-restricted videos).
REFERER = "https://neetcode.io/"
# ─────────────────────────────────────────────────────────────────────────

HERE = Path(__file__).resolve().parent


def resolve_ffmpeg() -> Path:
    p = Path(FFMPEG_PATH)
    if not p.is_absolute():
        p = HERE / p
    if not p.exists():
        sys.exit(f"ERROR: ffmpeg not found at: {p}\n"
                 f"Fix the FFMPEG_PATH variable at the top of this script.")
    return p


def ensure_yt_dlp():
    try:
        subprocess.run([sys.executable, "-m", "yt_dlp", "--version"],
                       check=True, capture_output=True)
    except Exception:
        print(">> yt-dlp not found — installing with pip ...", flush=True)
        subprocess.run([sys.executable, "-m", "pip", "install", "-U", "yt-dlp"],
                       check=True)


def download(video_id: str, video_hash: str, filename: str,
             destination: str | None = None) -> Path:
    ensure_yt_dlp()
    ffmpeg = resolve_ffmpeg()

    dest = Path(destination).expanduser().resolve() if destination else HERE
    dest.mkdir(parents=True, exist_ok=True)

    filename = Path(filename).stem                      # drop any extension given
    url = f"https://player.vimeo.com/video/{video_id}?h={video_hash}"
    outtmpl = str(dest / f"{filename}.%(ext)s")

    cmd = [
        sys.executable, "-m", "yt_dlp",
        "-f", "bestvideo+bestaudio/best",               # highest quality
        "--merge-output-format", "mkv",                 # lossless container
        "-o", outtmpl,
        "--no-playlist",
        "--referer", REFERER,
        "--ffmpeg-location", str(ffmpeg.parent),
        url,
    ]

    print(f">> Video : {url}")
    print(f">> Output: {dest / (filename + '.mkv')}")
    print()
    subprocess.run(cmd, check=True)

    out = dest / f"{filename}.mkv"
    print(f"\n>> Done: {out}")
    return out


def main():
    ap = argparse.ArgumentParser(description="Download highest-quality Vimeo video as MKV.")
    ap.add_argument("video_id", help="numeric Vimeo video id, e.g. 741856436")
    ap.add_argument("hash", help="unlisted hash, the ?h=... value, e.g. 5426746fca")
    ap.add_argument("filename", help="output file name (without extension)")
    ap.add_argument("-d", "--dest", default=None,
                    help="destination folder (default: this script's folder)")
    args = ap.parse_args()
    download(args.video_id, args.hash, args.filename, args.dest)


if __name__ == "__main__":
    main()
