import React from "react"

interface TextAreaProps {
  id?: string
  placeholder?: string
  rows?: number
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  className?: string
  disabled?: boolean
  error?: boolean
  hint?: string
}

const TextArea: React.FC<TextAreaProps> = ({
  id,
  placeholder = "Enter your message...",
  rows = 3,
  value = "",
  onChange,
  className = "",
  disabled = false,
  error = false,
  hint = "",
}) => {
  let textareaClasses =
    "w-full rounded-lg border px-4 py-2.5 text-sm focus:outline-hidden resize-none transition-colors " +
    className

  if (disabled) {
    textareaClasses +=
      " bg-gray-100 opacity-50 text-gray-500 border-gray-300 cursor-not-allowed"
  } else if (error) {
    textareaClasses +=
      " bg-transparent text-gray-800 border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500/40"
  } else {
    textareaClasses +=
      " bg-transparent text-gray-800 border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40"
  }

  return (
    <div className="relative">
      <textarea
        id={id}
        placeholder={placeholder}
        rows={rows}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={textareaClasses}
      />
      {hint && (
        <p
          className={`mt-2 text-xs ${
            error ? "text-red-600" : "text-gray-500"
          }`}
        >
          {hint}
        </p>
      )}
    </div>
  )
}

export default TextArea
