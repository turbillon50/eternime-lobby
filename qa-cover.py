import asyncio,json
from playwright.async_api import async_playwright
TOKEN=open("qa-token.txt").read().strip()
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(args=["--no-sandbox"])
    ctx=await b.new_context(viewport={"width":390,"height":844},is_mobile=True,has_touch=True)
    await ctx.add_cookies([{"name":"eternime_session","value":TOKEN,"domain":"eternime.org","path":"/","secure":True}])
    pg=await ctx.new_page(); await pg.goto("https://eternime.org/app/recuerdos",wait_until="networkidle"); await pg.wait_for_timeout(1500)
    pb=await pg.evaluate("()=>{const m=document.querySelector('main');return m?getComputedStyle(m).paddingBottom:null}")
    print(json.dumps({"main_padding_bottom":pb}))
    await b.close()
asyncio.run(main())
