import React, { useState, useEffect } from 'react'
import { usePerformanceMonitor } from '../../hooks/usePerformanceMonitor'
import { BarChart3, Zap, Clock, Monitor } from 'lucide-react'
import CustomButton from './CustomButton'

interface PerformanceDebugProps {
  className?: string
}

export const PerformanceDebug: React.FC<PerformanceDebugProps> = ({ className = '' }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [metrics, setMetrics] = useState<any[]>([])
  const { getMetrics } = usePerformanceMonitor()

  useEffect(() => {
    if (isOpen) {
      setMetrics(getMetrics())
    }
  }, [isOpen, getMetrics])

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  const formatMetricValue = (metric: any) => {
    if (metric.name.includes('time') || metric.name.includes('duration') || metric.name.includes('interval')) {
      return `${metric.value.toFixed(2)}ms`
    }
    return metric.value.toFixed(2)
  }

  const getMetricIcon = (type: string) => {
    switch (type) {
      case 'navigation': return <Monitor className="w-4 h-4" />
      case 'resource': return <BarChart3 className="w-4 h-4" />
      case 'interaction': return <Zap className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  const getCoreWebVitals = () => {
    const lcp = metrics.find(m => m.name === 'lcp')?.value
    const fid = metrics.find(m => m.name === 'fid')?.value
    const cls = metrics.find(m => m.name === 'cls')?.value

    return { lcp, fid, cls }
  }

  const coreVitals = getCoreWebVitals()

  return (
    <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
      {/* Toggle Button */}
      <CustomButton
        onClick={() => setIsOpen(!isOpen)}
        variant="secondary"
        size="sm"
        className="shadow-lg"
      >
        <BarChart3 className="w-4 h-4 mr-2" />
        Performance
      </CustomButton>

      {/* Debug Panel */}
      {isOpen && (
        <div className="absolute bottom-12 right-0 w-96 max-h-96 bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 flex items-center">
              <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
              Performance Monitor
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <div className="p-4 max-h-80 overflow-y-auto">
            {/* Core Web Vitals */}
            <div className="mb-4">
              <h4 className="font-medium text-gray-900 mb-2">Core Web Vitals</h4>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className="bg-blue-50 p-2 rounded">
                  <div className="text-blue-600 font-medium">LCP</div>
                  <div className="text-gray-900">
                    {coreVitals.lcp ? `${coreVitals.lcp.toFixed(0)}ms` : 'N/A'}
                  </div>
                </div>
                <div className="bg-green-50 p-2 rounded">
                  <div className="text-green-600 font-medium">FID</div>
                  <div className="text-gray-900">
                    {coreVitals.fid ? `${coreVitals.fid.toFixed(0)}ms` : 'N/A'}
                  </div>
                </div>
                <div className="bg-yellow-50 p-2 rounded">
                  <div className="text-yellow-600 font-medium">CLS</div>
                  <div className="text-gray-900">
                    {coreVitals.cls ? coreVitals.cls.toFixed(3) : 'N/A'}
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Metrics */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Recent Metrics</h4>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {metrics.slice(-10).reverse().map((metric: any, index: number) => (
                  <div key={index} className="flex items-center justify-between text-sm py-1 px-2 bg-gray-50 rounded">
                    <div className="flex items-center flex-1 min-w-0">
                      {getMetricIcon(metric.type)}
                      <span className="ml-2 truncate text-gray-700">{metric.name}</span>
                    </div>
                    <span className="text-gray-900 font-mono text-xs ml-2">
                      {formatMetricValue(metric)}
                    </span>
                  </div>
                ))}
                {metrics.length === 0 && (
                  <div className="text-gray-500 text-sm text-center py-4">
                    No metrics recorded yet
                  </div>
                )}
              </div>
            </div>

            {/* Summary Stats */}
            <div className="mt-4 pt-3 border-t border-gray-200">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-600">Total Metrics</div>
                  <div className="font-semibold text-gray-900">{metrics.length}</div>
                </div>
                <div>
                  <div className="text-gray-600">Navigation Events</div>
                  <div className="font-semibold text-gray-900">
                    {metrics.filter(m => m.type === 'navigation').length}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PerformanceDebug
