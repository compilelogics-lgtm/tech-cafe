import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import powerButton from "./../../assets/-button.svg";
import novartislogotransparent from "./../../assets/novartis-logo-transparent-1.png";
import group from "./../../assets/group.png";

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
      <img
        className="absolute inset-0 w-full h-full object-cover"
        src={group}
        alt="Background grid pattern"
      />

      {/* Decorative dots */}
      {decorativeDots.map((dot, i) => (
        <div
          key={i}
          className={`${dot.top} ${dot.left} ${dot.size} ${dot.color} ${dot.rounded} ${dot.shadow} absolute opacity-30`}
        />
      ))}

      {/* Main content wrapper */}
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

      {/* Start Button */}
      <div className="relative flex flex-col items-center gap-3 sm:gap-4 mt-10 sm:mt-16 md:mt-20">
        <Button
          variant="default"
          size="icon"
          onClick={() => navigate("/login")}
          className="w-[120px] h-[120px] sm:w-[150px] sm:h-[150px] md:w-[180px] md:h-[180px] rounded-full bg-primary hover:bg-primary/90 transition-colors border-0 flex items-center justify-center"
          aria-label="Start application"
        >
          <img
            src={powerButton}
            alt="Power button"
            className="w-[80px] h-[80px] sm:w-[100px] sm:h-[100px] md:w-[120px] md:h-[120px]"
          />
        </Button>

        <span className="text-white text-sm sm:text-base md:text-lg font-medium tracking-wide">
          Tap to Start
        </span>
      </div>
    </main>
  );
};

export default Welcome;
