export default function ConfidenceBadge({ score }: { score?: number }) {
  const confidenceScore = score ?? 0.8

  const getColor = () => {
    if (confidenceScore >= 0.9) return 'bg-emerald-50 text-emerald-700'
    if (confidenceScore >= 0.7) return 'bg-amber-50 text-amber-700'
    return 'bg-red-100 text-red-700'
  }

  const getLabel = () => {
    if (confidenceScore >= 0.9) return 'High'
    if (confidenceScore >= 0.7) return 'Medium'
    return 'Low'
  }

  return (
    <span className={`text-xs px-2 py-1 rounded ${getColor()}`}>
      {getLabel()} ({Math.round(confidenceScore * 100)}%)
    </span>
  )
}
