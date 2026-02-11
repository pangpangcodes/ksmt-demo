'use client'

import { useState, useEffect, useRef, KeyboardEvent } from 'react'
import { X, Lightbulb } from 'lucide-react'
import { normalizeTags, validateTag } from '@/lib/tagUtils'
import { useThemeStyles } from '@/hooks/useThemeStyles'

interface TagWithCount {
  tag: string
  count: number
}

interface TagSuggestion {
  suggested_tag: string | null
  confidence: number
}

interface TagInputProps {
  value: string[]
  onChange: (tags: string[]) => void
  vendorType: string
  placeholder?: string
  maxTags?: number
}

export default function TagInput({
  value,
  onChange,
  vendorType,
  placeholder = 'Add tags (press Enter)',
  maxTags = 10
}: TagInputProps) {
  const theme = useThemeStyles()
  const [inputValue, setInputValue] = useState('')
  const [suggestions, setSuggestions] = useState<TagWithCount[]>([])
  const [filteredSuggestions, setFilteredSuggestions] = useState<TagWithCount[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [aiSuggestion, setAiSuggestion] = useState<TagSuggestion | null>(null)
  const [isLoadingSuggestion, setIsLoadingSuggestion] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)

  // Fetch suggestions when vendor type changes (or on mount for all tags)
  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const token = localStorage.getItem('auth_token')
        if (!token) return

        // If vendor type is provided, fetch type-specific tags; otherwise fetch all tags
        const url = vendorType
          ? `/api/planner/vendor-library/tags?vendor_type=${encodeURIComponent(vendorType)}`
          : '/api/planner/vendor-library/tags'

        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` }
        })

        const data = await response.json()
        if (data.success) {
          setSuggestions(data.data.tags)
        }
      } catch (error) {
        console.error('Error fetching tag suggestions:', error)
      }
    }

    fetchSuggestions()
  }, [vendorType])

  // Filter suggestions based on input
  useEffect(() => {
    if (!inputValue.trim()) {
      setFilteredSuggestions(suggestions.slice(0, 10))
      setSelectedIndex(0)
      return
    }

    const filtered = suggestions
      .filter(s =>
        s.tag.toLowerCase().includes(inputValue.toLowerCase()) &&
        !value.includes(s.tag)
      )
      .slice(0, 10)

    setFilteredSuggestions(filtered)
    setSelectedIndex(0)
  }, [inputValue, suggestions, value])

  // Debounced AI suggestion check
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    setAiSuggestion(null)

    if (!inputValue.trim() || inputValue.length < 3) {
      return
    }

    // Check if input matches existing suggestions
    const exactMatch = suggestions.some(s =>
      s.tag.toLowerCase() === inputValue.toLowerCase()
    )
    if (exactMatch) {
      return
    }

    timeoutRef.current = setTimeout(async () => {
      setIsLoadingSuggestion(true)
      try {
        const token = localStorage.getItem('auth_token')
        if (!token) return

        const response = await fetch('/api/planner/vendor-library/tags/suggest', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            tag: inputValue,
            vendor_type: vendorType,
            existing_tags: suggestions.map(s => s.tag)
          })
        })

        const data = await response.json()
        if (data.success && data.data.suggested_tag && data.data.confidence > 0.7) {
          setAiSuggestion(data.data)
        }
      } catch (error) {
        console.error('Error getting AI suggestion:', error)
      } finally {
        setIsLoadingSuggestion(false)
      }
    }, 300)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [inputValue, vendorType, suggestions])

  const addTag = (tag: string) => {
    const validation = validateTag(tag)
    if (!validation.valid) {
      alert(validation.error)
      return
    }

    if (value.length >= maxTags) {
      alert(`Maximum ${maxTags} tags allowed`)
      return
    }

    const normalized = normalizeTags([tag, ...value])
    onChange(normalized)
    setInputValue('')
    setShowSuggestions(false)
    setAiSuggestion(null)
  }

  const removeTag = (tagToRemove: string) => {
    onChange(value.filter(t => t !== tagToRemove))
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()

      if (aiSuggestion?.suggested_tag) {
        // If AI suggestion is shown, use it
        addTag(aiSuggestion.suggested_tag)
      } else if (showSuggestions && filteredSuggestions.length > 0) {
        // If suggestions dropdown is shown, use selected suggestion
        addTag(filteredSuggestions[selectedIndex].tag)
      } else if (inputValue.trim()) {
        // Otherwise add the typed tag
        addTag(inputValue.trim())
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
      setAiSuggestion(null)
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      removeTag(value[value.length - 1])
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev =>
        prev < filteredSuggestions.length - 1 ? prev + 1 : prev
      )
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => prev > 0 ? prev - 1 : prev)
    } else if (e.key === ',' || e.key === ';') {
      e.preventDefault()
      if (inputValue.trim()) {
        addTag(inputValue.trim())
      }
    }
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value)
            setShowSuggestions(true)
          }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => {
            // Delay to allow click on suggestion
            setTimeout(() => setShowSuggestions(false), 200)
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-stone-900 focus:border-transparent"
        />

        {/* Autocomplete Dropdown */}
        {showSuggestions && filteredSuggestions.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
            {filteredSuggestions.map((suggestion, index) => (
              <button
                key={suggestion.tag}
                onClick={() => addTag(suggestion.tag)}
                className={`w-full px-4 py-2 text-left hover:bg-gray-100 flex justify-between items-center ${
                  index === selectedIndex ? 'bg-gray-100' : ''
                }`}
              >
                <span className="text-sm text-gray-700">{suggestion.tag}</span>
                <span className="text-xs text-gray-500">({suggestion.count})</span>
              </button>
            ))}
          </div>
        )}

        {/* AI Spelling Suggestion */}
        {aiSuggestion && (
          <div className="absolute z-10 w-full mt-1 bg-amber-50 border border-amber-300 rounded-lg shadow-lg p-3">
            <div className="flex items-start gap-2">
              <Lightbulb className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-gray-700">
                  Did you mean <strong className={theme.textPrimary}>{aiSuggestion.suggested_tag}</strong>?
                </p>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => addTag(aiSuggestion.suggested_tag!)}
                    className={`px-3 py-1 text-xs font-medium ${theme.primaryButton} ${theme.textOnPrimary} rounded-full ${theme.primaryButtonHover}`}
                  >
                    Use this
                  </button>
                  <button
                    onClick={() => {
                      setAiSuggestion(null)
                      addTag(inputValue.trim())
                    }}
                    className="px-3 py-1 text-xs font-medium bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300"
                  >
                    Keep "{inputValue}"
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tag Pills */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map(tag => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
            >
              {tag}
              <button
                onClick={() => removeTag(tag)}
                className="hover:text-red-600 transition-colors"
                aria-label={`Remove ${tag}`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {value.length >= maxTags - 2 && (
        <p className="text-xs text-amber-600">
          {maxTags - value.length} tag{maxTags - value.length !== 1 ? 's' : ''} remaining
        </p>
      )}
    </div>
  )
}
