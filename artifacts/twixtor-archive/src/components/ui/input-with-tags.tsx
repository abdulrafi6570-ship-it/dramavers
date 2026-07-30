import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface TagProps {
  text: string;
  onRemove: () => void;
}

const Tag = ({ text, onRemove }: TagProps) => {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.8, y: -10, filter: "blur(10px)" }}
      animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
      exit={{ opacity: 0, scale: 0.8, y: -10, filter: "blur(10px)" }}
      transition={{ duration: 0.4, ease: "circInOut", type: "spring" }}
      className="bg-[#11111198] px-2 py-1 rounded-xl text-sm flex items-center gap-1 shadow-[0_0_10px_rgba(0,0,0,0.2)] backdrop-blur-sm text-white"
    >
      {text}
      <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
        <Button
          type="button"
          onClick={onRemove}
          className="bg-transparent text-xs h-fit flex items-center rounded-full justify-center text-white p-1 hover:bg-[#11111136]"
        >
          <X className="w-4 h-4" />
        </Button>
      </motion.div>
    </motion.span>
  );
};

interface InputWithTagsProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  className?: string;
  limit?: number;
}

const InputWithTags = ({
  value,
  onChange,
  placeholder,
  className,
  limit = 10,
}: InputWithTagsProps) => {
  const [inputValue, setInputValue] = useState("");

  const commitTag = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    if (limit && value.length >= limit) return;
    if (value.includes(trimmed)) {
      setInputValue("");
      return;
    }
    onChange([...value, trimmed]);
    setInputValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commitTag();
    } else if (e.key === "Backspace" && !inputValue && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  const removeTag = (indexToRemove: number) => {
    onChange(value.filter((_, index) => index !== indexToRemove));
  };

  return (
    <div className={cn("flex flex-col gap-2 w-full", className)}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
        animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
        transition={{ duration: 0.5, type: "spring", stiffness: 200 }}
      >
        <motion.input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={commitTag}
          placeholder={placeholder || "Ketik lalu tekan Enter..."}
          whileHover={{ scale: 1.01, backgroundColor: "#111111d1" }}
          whileTap={{ scale: 0.99, backgroundColor: "#11111198" }}
          className="w-full px-4 py-2 bg-[#11111198] shadow-[0_0_20px_rgba(0,0,0,0.2)] border-none rounded-xl backdrop-blur-sm text-white disabled:opacity-50 disabled:cursor-not-allowed outline-none ring-0"
          disabled={limit ? value.length >= limit : false}
        />
      </motion.div>
      <div className="flex flex-wrap gap-2">
        <AnimatePresence>
          {value.map((tag, index) => (
            <Tag key={`${tag}-${index}`} text={tag} onRemove={() => removeTag(index)} />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export { InputWithTags };
