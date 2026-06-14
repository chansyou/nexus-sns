export function TweetSkeleton() {
  return (
    <div className="flex gap-3 p-4 border-b border-gray-200 dark:border-gray-800 animate-pulse">
      <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-2 pt-0.5">
        <div className="flex gap-2 items-center">
          <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded-full" />
          <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded-full" />
        </div>
        <div className="h-3 w-full bg-gray-200 dark:bg-gray-700 rounded-full" />
        <div className="h-3 w-4/5 bg-gray-200 dark:bg-gray-700 rounded-full" />
        <div className="h-3 w-2/3 bg-gray-200 dark:bg-gray-700 rounded-full" />
        <div className="flex gap-6 mt-3 pt-1">
          <div className="h-3 w-10 bg-gray-200 dark:bg-gray-700 rounded-full" />
          <div className="h-3 w-10 bg-gray-200 dark:bg-gray-700 rounded-full" />
        </div>
      </div>
    </div>
  )
}
