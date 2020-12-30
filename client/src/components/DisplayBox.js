import React from 'react'
import { useAtom } from 'jotai'
import { displayModeAtom } from '../jotai'
import Notes from './Notes'

const DisplayBox = () => {
  const [displayMode, setDisplayMode] = useAtom(displayModeAtom)

  const displayContent = (displayMode) => {
    switch(displayMode) {
      case 'LocalPVP': return displayMode

      case 'OnlinePVP': return displayMode

      case 'Stats': return displayMode

      case 'Controls': return displayMode

      case 'Tutorial': return displayMode

      default: return (<Notes />)
    }
  }

  return (
    <div className="display-container">
      { displayContent(displayMode) }
    </div>
  )
}
export default DisplayBox