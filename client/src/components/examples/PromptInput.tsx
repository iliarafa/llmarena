import { useState } from "react";
import PromptInput from "../PromptInput";

export default function PromptInputExample() {
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = () => {
    console.log("Submit triggered with prompt:", prompt);
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 2000);
  };

  return (
    <div className="p-6 max-w-4xl">
      <PromptInput
        value={prompt}
        onChange={setPrompt}
        onSubmit={handleSubmit}
        isLoading={isLoading}
      />
    </div>
  );
}
