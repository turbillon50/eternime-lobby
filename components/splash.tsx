"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { motionTokens } from "@/lib/motion-tokens";

export function Splash() {
  const [show, setShow] = useState(true);
  useEffect(() => {
    try {
      if (sessionStorage.getItem("eternime-splash-v3")) { queueMicrotask(() => setShow(false)); return; }
      sessionStorage.setItem("eternime-splash-v3", "1");
    } catch {}
    const stop = setTimeout(() => setShow(false), 1100);
    return () => clearTimeout(stop);
  }, []);

  return <AnimatePresence>{show ? (
    <motion.div className="eon-splash" initial={{opacity:1}} exit={{opacity:0}} transition={{duration:motionTokens.cinematic,ease:motionTokens.ease}}>
      <motion.div className="eon-splash-mesh" initial={{scale:.84,opacity:0}} animate={{scale:1,opacity:1,rotate:[0,8,-5,0]}} transition={{scale:{duration:motionTokens.cinematic,ease:motionTokens.ease},opacity:{duration:motionTokens.standard},rotate:{duration:4,repeat:Infinity,ease:"easeInOut"}}}>
        <i/><i/><i/>
      </motion.div>
      <motion.div className="eon-splash-word" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:.18,duration:motionTokens.entrance,ease:motionTokens.ease}}>Eternime</motion.div>
      <motion.p initial={{opacity:0}} animate={{opacity:.58}} transition={{delay:.3,duration:motionTokens.standard,ease:motionTokens.ease}}>Tu segunda memoria</motion.p>
    </motion.div>
  ) : null}</AnimatePresence>;
}
