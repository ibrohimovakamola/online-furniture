export default function ProductCardSkeleton() {
  return (
    <div className="animate-pulse rounded-lg border border-gray-100 bg-white overflow-hidden">
      <div className="aspect-[4/3] bg-gray-200" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-4 bg-gray-200 rounded w-1/2" />
        <div className="h-3 bg-gray-100 rounded w-full" />
      </div>
    </div>
  )
}
