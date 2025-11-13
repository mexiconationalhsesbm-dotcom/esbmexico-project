interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean
  hint?: string
}

const TextInput: React.FC<TextAreaProps> = ({
  className = "",
  error = false,
  hint = "",
  ...props
}) => {
  return (
    <div className="relative">
      <textarea
        {...props}  // ✅ This includes register values correctly
        className={`w-full rounded-lg border px-4 py-2.5 text-sm resize-none focus:outline-hidden transition-colors ${
          error
            ? "border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500/40"
            : "border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40"
        } ${className}`}
      />

      {hint && (
        <p className={`mt-2 text-xs ${error ? "text-red-600" : "text-gray-500"}`}>
          {hint}
        </p>
      )}
    </div>
  )
}

export default TextInput
