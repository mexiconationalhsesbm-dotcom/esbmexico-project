import * as ProgressPrimitive from "@radix-ui/react-progress"

export function Progress({ value }: { value: number }) {
  return (
    <ProgressPrimitive.Root className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
      <ProgressPrimitive.Indicator
        className="h-full bg-blue-500 transition-all"
        style={{ width: `${value}%` }}
      />
    </ProgressPrimitive.Root>
  )
}
