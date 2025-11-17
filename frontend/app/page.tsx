import Link from "next/link";
import { TextLoop } from "@/components/motion-primitives/text-loop";
import { TextEffect } from "@/components/motion-primitives/text-effect";
import { Bot } from "@/components/animate-ui/icons/bot";
import { AnimateIcon } from "@/components/animate-ui/icons/icon";
import { Blocks } from "@/components/animate-ui/icons/blocks";
import Provider from "./Provider";
import X402FlowDiagram from "@/components/home/X402FlowDiagram";

export default function Home() {
  return (
    <Provider>
      <div className="z-10 flex flex-col items-center justify-center text-center min-h-screen">
        <h1 className="text-5xl sm:text-6xl font-bold text-zinc-50 px-3 sm:px-0">
          Trade smarter, faster,{" "}
          <TextLoop
            className="overflow-y-clip"
            transition={{
              type: "spring",
              stiffness: 900,
              damping: 80,
              mass: 10,
            }}
            variants={{
              initial: {
                y: 20,
                rotateX: 90,
                opacity: 0,
                filter: "blur(4px)",
              },
              animate: {
                y: 0,
                rotateX: 0,
                opacity: 1,
                filter: "blur(0px)",
              },
              exit: {
                y: -20,
                rotateX: -90,
                opacity: 0,
                filter: "blur(4px)",
              },
            }}
          >
            <span>stronger</span>
            <span>brighter</span>
            <span>steadier</span>
            <span>powerful</span>
            <span>decisive</span>
          </TextLoop>
        </h1>
        <TextEffect
          per="word"
          as="h3"
          preset="blur"
          className="mt-5 text-zinc-50 px-3 sm:px-0"
        >
          Profit is just about getting it right. We do the hard work for you.
          Make money never been easier.
        </TextEffect>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mt-6 w-full sm:justify-center">
          <Link href="https://t.me/syra_trading_bot" target="_blank">
            <button className="bg-transparent text-white px-6 py-3 rounded-full text-lg font-bold border-4 border-blue-500 hover:bg-blue-500 cursor-pointer w-4/5 sm:w-60 transition-colors duration-300">
              <AnimateIcon
                animateOnHover
                className="flex items-center gap-1 justify-center"
              >
                <Bot />
                Try Telegram Bot
              </AnimateIcon>
            </button>
          </Link>
          <Link href="/dashboard">
            <button className="bg-white text-zinc-900 px-6 py-3 rounded-full text-lg font-bold w-4/5 sm:w-60 transition-colors duration-300 hover:bg-gray-300 cursor-pointer border-4 border-white hover:border-gray-300">
              <AnimateIcon
                animateOnHover
                animation="path-loop"
                className="flex items-center gap-1.5 justify-center"
              >
                <Blocks size={24} />
                Try Web App
              </AnimateIcon>
            </button>
          </Link>
        </div>
      </div>
      <X402FlowDiagram />
    </Provider>
  );
}
