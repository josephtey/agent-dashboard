'use client'

import { Moon, Sun, Monitor } from 'lucide-react'
import { useTheme } from './theme-provider'
import { Button } from './ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  const cycleTheme = () => {
    if (theme === 'light') {
      setTheme('dark')
    } else if (theme === 'dark') {
      setTheme('system')
    } else {
      setTheme('light')
    }
  }

  const getIcon = () => {
    if (theme === 'dark') return <Moon className="h-5 w-5" />
    if (theme === 'system') return <Monitor className="h-5 w-5" />
    return <Sun className="h-5 w-5" />
  }

  const getLabel = () => {
    if (theme === 'dark') return 'Dark'
    if (theme === 'system') return 'System'
    return 'Light'
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={cycleTheme}
            className="rounded-full"
          >
            {getIcon()}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{getLabel()} mode</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
