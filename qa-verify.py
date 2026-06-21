import asyncio, json
from playwright.async_api import async_playwright
TOKEN="""eyJhbGciOiJIUzI1NiJ9.eyJlbWFpbCI6InR1cmJpbGxvbjUwQGdtYWlsLmNvbSIsIm5hbWUiOiJMdWlzIiwicm9sZSI6InVzZXIiLCJzdWIiOiJmNDcwNDAwZS01ODAwLTQ1YzAtYTIzYy0yYmU2MmU2MzllNDMiLCJpYXQiOjE3ODIwNzY5NzYsImV4cCI6MTc4NDY2ODk3Nn0.d7tTvF_ObBB2lecmHvuew-LgMGgftif2k4ilSwY1s2s""".strip()
async def main():
  out={}
  async with async_playwright() as p:
    b=await p.chromium.launch(args=["--no-sandbox"])
    ctx=await b.new_context(viewport={"width":390,"height":844},device_scale_factor=2,is_mobile=True,has_touch=True)
    await ctx.add_cookies([{"name":"eternime_session","value":TOKEN,"domain":"eternime.org","path":"/","httpOnly":True,"secure":True,"sameSite":"Lax"}])
    pg=await ctx.new_page()
    r=await pg.goto("https://eternime.org/app",wait_until="networkidle",timeout=60000)
    out["status"]=r.status; out["url"]=pg.url
    await pg.wait_for_timeout(2500)
    await pg.screenshot(path="/root/eternime-lobby/shot-1-top.png")
    nav=pg.locator(".et-bottom-nav")
    out["nav_count"]=await nav.count()
    if await nav.count():
      box1=await nav.bounding_box()
      pos=await nav.evaluate("el=>getComputedStyle(el).position")
      vis=await nav.is_visible()
      out["nav_position_css"]=pos; out["nav_visible"]=vis; out["nav_box_initial"]=box1
      # scroll the main/page down
      await pg.evaluate("window.scrollTo(0, document.body.scrollHeight)")
      await pg.evaluate("document.querySelector('main')?.scrollTo(0, 99999)")
      await pg.wait_for_timeout(800)
      box2=await nav.bounding_box()
      out["nav_box_after_scroll"]=box2
      out["nav_moved_px"]=round(abs((box1['y']-box2['y'])),2) if box1 and box2 else None
      out["viewport_h"]=844
      out["bar_at_bottom"]= (box2['y']+box2['height']) if box2 else None
      await pg.screenshot(path="/root/eternime-lobby/shot-2-scrolled.png")
      # click second tab (Boveda)
      items=pg.locator(".et-bottom-nav a")
      out["tab_links"]=await items.count()
      url_before=pg.url
      await items.nth(1).click()
      await pg.wait_for_timeout(1800)
      out["url_after_tap"]=pg.url; out["navigated"]= pg.url!=url_before
      out["nav_still_present"]=await pg.locator(".et-bottom-nav").count()>0
      await pg.screenshot(path="/root/eternime-lobby/shot-3-after-tap.png")
    await b.close()
  print(json.dumps(out,indent=2,default=str))
asyncio.run(main())
