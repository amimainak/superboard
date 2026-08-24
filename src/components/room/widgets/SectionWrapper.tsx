'use client'

import React, { useState, useCallback } from 'react'

import { useCollapsibleSections } from './useCollapsibleSections'


/* Shared wrapper for collapsible toolkit sections. Handles the section title
   with collapse/expand and chevron rotation, plus a body container
   that supports grid-template-rows animation for smooth collapse. */

interface SectionWrapperProps {
  id: string
  title: string
  children: React.ReactNode
  isDark: boolean
}

export function SectionWrapper({ id, title, children, isDark }: SectionWrapperProps) {
  const { isCollapsed, toggle } = useCollapsibleSections()

  const sectionClass = 'toolkit-section' + (isDark ? '' : '-light') + (isCollapsed(id) ? ' toolkit-section-collapsed' : '')
  return (
    <div className={sectionClass}>
        <div
          className={'toolkit-section-title' + (isCollapsed(id) ? ' toolkit-section-collapsed' : '')}
          onClick={() => toggle(id)}
          style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</span>
            <span style={{ fontSize: 14, lineHeight: 1, opacity: isCollapsed(id) ? 0 : 0.4, transform: isCollapsed(id) ? 'rotate(0deg)' : 'rotate(180deg)', transition: 'transform 0.2s ease' }}>&#x2212;</span>
          </div>
        <div className={'toolkit-section-body'}>
          {children}
        </div>
    </div>
  )
}
