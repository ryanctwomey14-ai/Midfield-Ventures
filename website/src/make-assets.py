from PIL import Image
from collections import deque, Counter
import os

OUT = "website/assets/img"
os.makedirs(OUT, exist_ok=True)

def dist(a, b):
    return max(abs(a[0]-b[0]), abs(a[1]-b[1]), abs(a[2]-b[2]))

def knockout(path, tol=38, feather=42):
    """Flood-fill the background from the image border so interior whites survive."""
    im = Image.open(path).convert("RGBA")
    w, h = im.size
    px = im.load()
    bg = px[2, 2][:3]
    seen = bytearray(w*h)
    q = deque()
    for x in range(w):
        for y in (0, h-1):
            q.append((x, y))
    for y in range(h):
        for x in (0, w-1):
            q.append((x, y))
    while q:
        x, y = q.popleft()
        i = y*w + x
        if seen[i]:
            continue
        if dist(px[x, y][:3], bg) > tol:
            continue
        seen[i] = 1
        if x > 0: q.append((x-1, y))
        if x < w-1: q.append((x+1, y))
        if y > 0: q.append((x, y-1))
        if y < h-1: q.append((x, y+1))
    # binary knockout + soft edge on the fringe touching the removed region
    for y in range(h):
        for x in range(w):
            i = y*w + x
            r, g, b, a = px[x, y]
            if seen[i]:
                px[x, y] = (r, g, b, 0)
            else:
                near_bg = False
                for dx, dy in ((1,0),(-1,0),(0,1),(0,-1)):
                    nx, ny = x+dx, y+dy
                    if 0 <= nx < w and 0 <= ny < h and seen[ny*w+nx]:
                        near_bg = True
                        break
                if near_bg:
                    d = dist((r, g, b), bg)
                    px[x, y] = (r, g, b, min(255, int(255 * min(1.0, d/feather))))
    return im.crop(im.getbbox())

def save(im, name, widths):
    for wd in widths:
        r = im.resize((wd, max(1, round(im.height * wd / im.width))), Image.LANCZOS)
        r.save(f"{OUT}/{name}-{wd}.png", optimize=True)
    print(name, im.size, "->", widths)

light_lockup = knockout("Midfield White.PNG")      # navy mark, transparent bg
dark_lockup  = knockout("Midfield Blue.PNG")       # white mark, transparent bg
light_emblem = knockout("Midfield White Emblem.PNG")
dark_emblem  = knockout("Midfield Blue Emblem.PNG")

save(light_lockup, "logo-navy", [260, 520])
save(dark_lockup,  "logo-white", [260, 520])
save(light_emblem, "emblem-navy", [96, 192, 512])
save(dark_emblem,  "emblem-white", [96, 192])

# favicon from the navy emblem on a navy tile (reads at 32px)
fav = Image.new("RGBA", (512, 512), (27, 48, 68, 255))
e = dark_emblem.copy()
e.thumbnail((440, 440), Image.LANCZOS)
fav.paste(e, ((512-e.width)//2, (512-e.height)//2), e)
fav.save(f"{OUT}/favicon-512.png")
fav.resize((180, 180), Image.LANCZOS).save(f"{OUT}/apple-touch-icon.png")
fav.resize((32, 32), Image.LANCZOS).save(f"{OUT}/favicon-32.png")
fav.resize((64, 64), Image.LANCZOS).save(f"{OUT}/favicon.ico", sizes=[(16,16),(32,32),(48,48)])

# principals photo: web-size it
p = Image.open("Kim and Dan.png").convert("RGB")
for wd in (720, 1440):
    p.resize((wd, round(p.height*wd/p.width)), Image.LANCZOS).save(f"{OUT}/principals-{wd}.jpg", quality=88, optimize=True, progressive=True)
print("principals", p.size)

# dominant brand colors from the emblem art
em = light_emblem.convert("RGBA").resize((160, 160))
c = Counter()
for pxl in em.getdata():
    if pxl[3] > 200:
        c[(pxl[0]//12*12, pxl[1]//12*12, pxl[2]//12*12)] += 1
print("\nEmblem palette:")
for col, n in c.most_common(10):
    print("  #%02X%02X%02X" % col, n)
