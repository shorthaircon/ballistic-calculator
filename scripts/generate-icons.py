from math import cos, radians, sin
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
ICONS = ROOT / "icons"
DESIGN_SIZE = 1024


def scaled(value: float) -> int:
    return round(value * DESIGN_SIZE / 512)


def rotated(point: tuple[float, float], angle: float = -45) -> tuple[int, int]:
    x, y = point
    cx = cy = 256
    dx, dy = x - cx, y - cy
    theta = radians(angle)
    return (
        scaled(cx + dx * cos(theta) - dy * sin(theta)),
        scaled(cy + dx * sin(theta) + dy * cos(theta)),
    )


def draw_icon(size: int, maskable: bool = False) -> Image.Image:
    image = Image.new("RGB", (DESIGN_SIZE, DESIGN_SIZE), "#191b16")
    draw = ImageDraw.Draw(image)

    if not maskable:
        draw.rounded_rectangle(
            (0, 0, DESIGN_SIZE - 1, DESIGN_SIZE - 1),
            radius=scaled(112),
            fill="#191b16",
        )

    card = [
        (56, 110), (110, 56), (428, 56), (456, 90),
        (456, 422), (422, 456), (90, 456), (56, 414),
    ]
    draw.polygon([(scaled(x), scaled(y)) for x, y in card], fill="#d4c59e")
    draw.line(
        [(scaled(x), scaled(y)) for x, y in card + [card[0]]],
        fill="#4a4536",
        width=scaled(14),
        joint="curve",
    )

    accent_lines = [((74, 126), (126, 74)), ((392, 74), (434, 74)),
                    ((74, 390), (74, 432)), ((404, 438), (438, 404))]
    for start, end in accent_lines:
        draw.line([rotated(start, 0), rotated(end, 0)], fill="#786f57", width=scaled(8))

    shell = [(92, 211), (296, 211), (326, 215), (360, 226),
             (396, 242), (426, 256), (396, 270), (360, 286),
             (326, 297), (296, 301), (92, 301)]
    shell_points = [rotated(point) for point in shell]
    draw.polygon(shell_points, fill="#080908")
    draw.line(shell_points + [shell_points[0]], fill="#22241d", width=scaled(12), joint="curve")

    for line in [((148, 214), (148, 298)), ((165, 256), (237, 256))]:
        draw.line([rotated(line[0]), rotated(line[1])], fill="#f2e9ca", width=scaled(12))

    try:
        font = ImageFont.truetype("arialbd.ttf", scaled(53))
    except OSError:
        font = ImageFont.load_default()
    label = Image.new("RGBA", (DESIGN_SIZE, DESIGN_SIZE), (0, 0, 0, 0))
    label_draw = ImageDraw.Draw(label)
    label_draw.text((scaled(181), scaled(221)), "HE", fill="#f2e9ca", font=font)
    label = label.rotate(45, resample=Image.Resampling.BICUBIC, center=(scaled(256), scaled(256)))
    image.paste(label, mask=label.getchannel("A"))

    trails = [((76, 230), (39, 230)), ((76, 256), (22, 256)), ((76, 282), (42, 282))]
    for start, end in trails:
        draw.line([rotated(start), rotated(end)], fill="#a02e23", width=scaled(17))

    return image.resize((size, size), Image.Resampling.LANCZOS)


ICONS.mkdir(exist_ok=True)
draw_icon(192).save(ICONS / "icon-192.png", optimize=True)
draw_icon(512).save(ICONS / "icon-512.png", optimize=True)
draw_icon(512, maskable=True).save(ICONS / "icon-maskable-512.png", optimize=True)
