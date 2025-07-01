import React from 'react';
import './DataTable.css';

function DataTable({
    title,
    columns,
    data,
    onRowClick,
    actions = [],
    emptyMessage = "No items found"
}) {
    if (!data || data.length === 0) {
        return (
            <div className="data-table">
                <h3>{title}</h3>
                <div className="empty-state">
                    <p>{emptyMessage}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="data-table">
            <h3>{title}</h3>
            <table>
                <thead>
                    <tr>
                        {columns.map((column, index) => (
                            <th key={index}>{column.header}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.map((item, rowIndex) => (
                        <tr
                            key={item.id || rowIndex}
                            onClick={() => onRowClick && onRowClick(item)}
                            className={onRowClick ? 'clickable-row' : ''}
                        >
                            {columns.map((column, colIndex) => (
                                <td key={colIndex}>
                                    {column.render ? column.render(item) : item[column.key]}
                                </td>
                            ))}
                            {actions.length > 0 && (
                                <td className="actions-cell">
                                    {actions.map((action, actionIndex) => (
                                        <button
                                            key={actionIndex}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                action.onClick(item);
                                            }}
                                            className={`action-button ${action.variant || 'default'}`}
                                        >
                                            {action.label}
                                        </button>
                                    ))}
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default DataTable; 