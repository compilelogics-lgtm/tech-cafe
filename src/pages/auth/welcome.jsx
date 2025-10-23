import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import powerButton from "./../../assets/-button.svg";
import novartislogotransparent from "./../../assets/novartis-logo-transparent-1.png";
import group from "./../../assets/group.png";


const decorativeDots = [
  {
    top: "top-[69px]",
    left: "left-[308px]",
    size: "w-2.5 h-2.5",
    color: "bg-[#ff3e6c]",
    rounded: "rounded-[5px]",
    shadow: "shadow-[0px_0px_60px_#ff3e6ccc,0px_0px_4px_#ff3e6c40]",
  },
  {
    top: "top-[685px]",
    left: "left-[303px]",
    size: "w-2 h-2",
    color: "bg-[#f6c744]",
    rounded: "rounded",
    shadow: "shadow-[0px_0px_60px_#f6c744cc,0px_0px_4px_#f6c74440]",
  },
  {
    top: "top-[530px]",
    left: "left-[39px]",
    size: "w-3 h-3",
    color: "bg-[#00c2ff]",
    rounded: "rounded-md",
    shadow: "shadow-[0px_0px_60px_#00c2ffcc,0px_0px_4px_#00c2ff40]",
  },
  {
    top: "top-[281px]",
    left: "left-[359px]",
    size: "w-2.5 h-2.5",
    color: "bg-[#f6c744]",
    rounded: "rounded-[5px]",
    shadow: "shadow-[0px_0px_60px_#f6c744cc,0px_0px_4px_#f6c74440]",
  },
  {
    top: "top-[793px]",
    left: "left-[97px]",
    size: "w-2 h-2",
    color: "bg-[#00c2ff]",
    rounded: "rounded",
    shadow: "shadow-[0px_0px_60px_#00c2ffcc,0px_0px_4px_#00c2ff40]",
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
    <main className="bg-[linear-gradient(180deg,rgba(10,15,37,1)_0%,rgba(16,32,66,1)_100%)] w-full min-h-screen relative overflow-hidden flex items-center justify-center">
      <img
        className="absolute w-[98.08%] h-full top-0 left-0 object-cover"
        alt="Background grid pattern"
        src={group}
      />

      {/* Decorative dots */}
      {decorativeDots.map((dot, index) => (
        <div
          key={`dot-${index}`}
          className={`${dot.top} ${dot.left} ${dot.size} ${dot.color} ${dot.rounded} ${dot.shadow} absolute opacity-[0.26]`}
        />
      ))}

      <section className="absolute top-[152px] left-1/2 transform -translate-x-1/2 w-[266px] h-[263px]">
        <h2 className="text-[#b4c1d9] text-xl text-center font-medium tracking-[0.20px]">
          WELCOME TO
        </h2>

        <img
          className="mx-auto mt-4 w-[241px] h-11 object-cover"
          alt="Novartis logo"
          src={novartislogotransparent}
        />

        <div className="flex flex-col items-center gap-4 mt-8">
          <h1 className="text-white text-4xl font-bold font-[Orbitron] tracking-[0.72px] text-center [text-shadow:0px_4px_30px_#00e0ff66]">
            TECH CAFÉ
          </h1>

          <div className="flex items-center gap-3">
            {keyboardKeys.map((key, index) => (
              <span
                key={`key-${index}`}
                className={`font-semibold ${key.color} text-xl tracking-[0.40px]`}
              >
                {key.text}
              </span>
            ))}
          </div>

          <p className="text-[#b4c1d9] text-sm text-center tracking-[0.28px] max-w-[302px]">
            Empowering Novartis with Advanced Technologies
          </p>
        </div>
      </section>

      {/* Center Button */}
      <div className="flex flex-col items-center gap-4 absolute top-[462px] left-1/2 transform -translate-x-1/2">
      <Button
        variant="default"
        size="icon"
        onClick={() => navigate("/login")}
        className="w-[152px] h-[152px] rounded-full bg-primary hover:bg-primary/90 transition-colors border-0 flex items-center justify-center"
        aria-label="Start application"
      >
        <img
          className="w-[100px] h-[100px]"
          alt="Power button"
           src={powerButton}
        />
      </Button>

      <span className="text-white text-sm font-medium tracking-[0.28px]">
        Tap to Start
      </span>
    </div>
    </main>
  );
};

export default Welcome;
