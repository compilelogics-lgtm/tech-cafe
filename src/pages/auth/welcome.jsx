import React from "react";
import { useNavigate } from "react-router-dom";
import novartislogotransparent from "./../../assets/novartis-logo-transparent-1.png";
import group from "./../../assets/group.png";
import { Power } from "lucide-react";

import bgMobile from "../../assets/image.png";
import bgDesktop from "../../assets/desktopbg.png";
const decorativeDots = [
  {
    top: "top-[4%]",
    left: "left-[70%]",
    size: "w-2.5 h-2.5",
    color: "bg-[#ff3e6c]",
    rounded: "rounded-[5px]",
    shadow: "shadow-[0_0_60px_#ff3e6ccc,0_0_4px_#ff3e6c40]",
  },
  {
    top: "top-[85%]",
    left: "left-[68%]",
    size: "w-2 h-2",
    color: "bg-[#f6c744]",
    rounded: "rounded",
    shadow: "shadow-[0_0_60px_#f6c744cc,0_0_4px_#f6c74440]",
  },
  {
    top: "top-[65%]",
    left: "left-[10%]",
    size: "w-3 h-3",
    color: "bg-[#00c2ff]",
    rounded: "rounded-md",
    shadow: "shadow-[0_0_60px_#00c2ffcc,0_0_4px_#00c2ff40]",
  },
  {
    top: "top-[35%]",
    left: "left-[80%]",
    size: "w-2.5 h-2.5",
    color: "bg-[#f6c744]",
    rounded: "rounded-[5px]",
    shadow: "shadow-[0_0_60px_#f6c744cc,0_0_4px_#f6c74440]",
  },
  {
    top: "top-[90%]",
    left: "left-[25%]",
    size: "w-2 h-2",
    color: "bg-[#00c2ff]",
    rounded: "rounded",
    shadow: "shadow-[0_0_60px_#00c2ffcc,0_0_4px_#00c2ff40]",
  },
];

const keyboardKeys = [
  { text: "ESC", color: "text-[#ff7a00]" },
  { text: "+", color: "text-white" },
  { text: "SHIFT", color: "text-[#ff3b5c]" },
  { text: "+", color: "text-white" },
  { text: "CTRL", color: "text-[#00e0ff]" },
];

const Welcome = () => {
  const navigate = useNavigate();

  return (
    <main className="relative flex flex-col items-center justify-center min-h-screen w-full overflow-hidden bg-[linear-gradient(180deg,rgba(10,15,37,1)_0%,rgba(16,32,66,1)_100%)]">
      {/* Background grid */}
            {/* Mobile BG */}
      <img
        src={bgMobile}
        alt="Mobile Background"
        className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none md:hidden"
      />

      {/* Desktop BG */}
      <img
        src={bgDesktop}
        alt="Desktop Background"
        className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none hidden md:block"
      />

      {/* Decorative dots */}
      {decorativeDots.map((dot, i) => (
        <div
          key={i}
          className={`${dot.top} ${dot.left} ${dot.size} ${dot.color} ${dot.rounded} ${dot.shadow} absolute opacity-30`}
        />
      ))}

      {/* Main content */}
      <section className="relative flex flex-col items-center text-center px-4 sm:px-8 mt-24 sm:mt-32 md:mt-40">
        <h2 className="text-[#b4c1d9] text-lg sm:text-xl md:text-2xl font-medium tracking-wide mb-3">
          WELCOME TO
        </h2>

        <img
          src={novartislogotransparent}
          alt="Novartis logo"
          className="w-[180px] sm:w-[240px] md:w-[300px] object-contain mx-auto mb-6"
        />

        <div className="flex flex-col items-center gap-4">
          <h1 className="text-white text-3xl sm:text-5xl md:text-6xl font-bold font-[Orbitron] tracking-wide text-center [text-shadow:0_4px_30px_#00e0ff66]">
            TECH CAFÉ
          </h1>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-center">
            {keyboardKeys.map((key, i) => (
              <span
                key={i}
                className={`font-semibold ${key.color} text-base sm:text-xl md:text-2xl tracking-wide`}
              >
                {key.text}
              </span>
            ))}
          </div>

          <p className="text-[#b4c1d9] text-sm sm:text-base md:text-lg max-w-[320px] sm:max-w-[420px] leading-relaxed mt-3">
            Empowering Novartis with Advanced Technologies
          </p>
        </div>
      </section>

      {/* Start Button (Figma Styled) */}
      <div className="relative flex flex-col items-center gap-3 sm:gap-4 mt-12 sm:mt-20 md:mt-24">
        <button
          onClick={() => navigate("/login")}
          aria-label="Start application"
          className="
            flex items-center justify-center
            w-[72px] h-[72px]
            sm:w-[90px] sm:h-[90px]
            md:w-[110px] md:h-[110px]
            bg-[#FF7A00]
            rounded-full
            shadow-[0_4px_40px_rgba(255,122,0,0.3)]
            transition-transform duration-200
            hover:scale-105 active:scale-95
          "
        >
          <Power
            className="
              text-white
              w-[28px] h-[28px]
              sm:w-[36px] sm:h-[36px]
              md:w-[44px] md:h-[44px]
            "
            strokeWidth={2.5}
          />
        </button>

        <span className="text-white text-sm sm:text-base md:text-lg font-medium tracking-wide">
          Tap to Start
        </span>
      </div>
    </main>
  );
};

export default Welcome;
