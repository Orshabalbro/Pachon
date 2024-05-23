import React from 'react'

interface BreadcrumbBarProps {
  children;
  className?;
}

function BreadcrumbBar({
    children,
    className,
}: BreadcrumbBarProps) {

    className = className ? 'component_breadcrumbbar '+className : 'component_breadcrumbbar'

    return (
        <React.Fragment>
            <div className={ className }>
                { children }
            </div>
            <div className='component_breadcrumbbar_push'></div>
        </React.Fragment>
    )
}

export default BreadcrumbBar
