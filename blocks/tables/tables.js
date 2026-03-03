import { fetchAEMData } from '../../scripts/utils/aem-data.js';
import { shouldShowByTargeting, hideBlockWithSection } from '../../scripts/utils/target-filter.js';

let environmentConfig = null;
const DEFAULT_CONFIG = {
  apiUrl: '',
  site: '',
  queryName: '',
  aemCloudBaseUrl: '',
};

/**
 * Gets tables configuration from AEM environment file
 * @returns {Promise<Object>} Configuration object with apiUrl, site, queryName and aemCloudBaseUrl
 */
async function getEnvironmentConfig() {
  if (environmentConfig) return environmentConfig;

  const config = await fetchAEMData('environment');
  environmentConfig = {
    apiUrl: config.data.find((item) => item.Key === 'AV_API_URL_CONTENT_FRAGMENTS')?.Text ?? DEFAULT_CONFIG.apiUrl,
    site: config.data.find((item) => item.Key === 'AV_NAME_SITE')?.Text ?? DEFAULT_CONFIG.site,
    queryName: config.data.find((item) => item.Key === 'AV_QUERY_NAME_TABLES')?.Text ?? DEFAULT_CONFIG.queryName,
    aemCloudBaseUrl: config.data.find((item) => item.Key === 'AV_AEM_CLOUD_BASE_PUBLISH')?.Text ?? DEFAULT_CONFIG.aemCloudBaseUrl,
  };
  return environmentConfig;
}

/**
 * Check if we're in author environment (Universal Editor)
 * @returns {boolean} True if in author environment
 */
function isAuthorEnvironment() {
  return !!(window.hlx?.aue || document.querySelector('meta[name="urn:auecon:aemconnection"]'));
}

/**
 * Extract targeting and content data from block structure
 * @param {HTMLElement} block - The tables block element
 * @returns {Object} Object with targetCountries, targetLanguages, contentFragmentDiv,
 * richTextDiv, headerBgColor, contentBgColor, enableZebraRows, zebraRowColor
 */
function extractTableData(block) {
  const allDivs = block.querySelectorAll(':scope > div');

  let targetCountries = null;
  let targetLanguages = null;
  let contentFragmentDiv;
  let richTextDiv;
  let headerBgColor = null;
  let contentBgColor = null;
  let enableZebraRows = false;
  let zebraRowColor = null;

  if (allDivs.length === 8) {
    // Full structure: targeting + content + colors + zebra
    const [
      countriesDiv, languagesDiv, contentDiv, richTextDivElement,
      headerColorDiv, contentColorDiv, zebraEnabledDiv, zebraColorDiv,
    ] = allDivs;

    // Extract targeting values
    const countriesCell = countriesDiv?.querySelector('div');
    if (countriesCell) {
      const p = countriesCell.querySelector('p');
      targetCountries = p ? p.textContent.trim() : countriesCell.textContent.trim();
    }

    const languagesCell = languagesDiv?.querySelector('div');
    if (languagesCell) {
      const p = languagesCell.querySelector('p');
      targetLanguages = p ? p.textContent.trim() : languagesCell.textContent.trim();
    }

    // Extract content divs
    contentFragmentDiv = contentDiv;
    richTextDiv = richTextDivElement;

    // Extract color values
    const headerColorCell = headerColorDiv?.querySelector('div');
    if (headerColorCell) {
      const p = headerColorCell.querySelector('p');
      const colorValue = p ? p.textContent.trim() : headerColorCell.textContent.trim();
      if (colorValue && colorValue !== '' && !colorValue.startsWith('/content')) {
        headerBgColor = colorValue;
      }
    }

    const contentColorCell = contentColorDiv?.querySelector('div');
    if (contentColorCell) {
      const p = contentColorCell.querySelector('p');
      const colorValue = p ? p.textContent.trim() : contentColorCell.textContent.trim();
      if (colorValue && colorValue !== '' && !colorValue.startsWith('/content')) {
        contentBgColor = colorValue;
      }
    }

    // Extract zebra rows configuration
    const zebraEnabledCell = zebraEnabledDiv?.querySelector('div');
    if (zebraEnabledCell) {
      const p = zebraEnabledCell.querySelector('p');
      const zebraValue = p
        ? p.textContent.trim().toLowerCase()
        : zebraEnabledCell.textContent.trim().toLowerCase();
      enableZebraRows = zebraValue === 'true';
    }

    const zebraColorCell = zebraColorDiv?.querySelector('div');
    if (zebraColorCell && enableZebraRows) {
      const p = zebraColorCell.querySelector('p');
      const colorValue = p ? p.textContent.trim() : zebraColorCell.textContent.trim();
      if (colorValue && colorValue !== '' && !colorValue.startsWith('/content')) {
        zebraRowColor = colorValue;
      }
    }
  } else if (allDivs.length === 6) {
    // Full structure: targeting + content + colors
    const [
      countriesDiv, languagesDiv, contentDiv,
      richTextDivElement, headerColorDiv, contentColorDiv,
    ] = allDivs;

    // Extract targeting values
    const countriesCell = countriesDiv?.querySelector('div');
    if (countriesCell) {
      const p = countriesCell.querySelector('p');
      targetCountries = p ? p.textContent.trim() : countriesCell.textContent.trim();
    }

    const languagesCell = languagesDiv?.querySelector('div');
    if (languagesCell) {
      const p = languagesCell.querySelector('p');
      targetLanguages = p ? p.textContent.trim() : languagesCell.textContent.trim();
    }

    // Extract content divs
    contentFragmentDiv = contentDiv;
    richTextDiv = richTextDivElement;

    // Extract color values
    const headerColorCell = headerColorDiv?.querySelector('div');
    if (headerColorCell) {
      const p = headerColorCell.querySelector('p');
      const colorValue = p ? p.textContent.trim() : headerColorCell.textContent.trim();
      if (colorValue && colorValue !== '' && !colorValue.startsWith('/content')) {
        headerBgColor = colorValue;
      }
    }

    const contentColorCell = contentColorDiv?.querySelector('div');
    if (contentColorCell) {
      const p = contentColorCell.querySelector('p');
      const colorValue = p ? p.textContent.trim() : contentColorCell.textContent.trim();
      if (colorValue && colorValue !== '' && !colorValue.startsWith('/content')) {
        contentBgColor = colorValue;
      }
    }
  } else if (allDivs.length === 4) {
    // Targeting only: [targetCountries, targetLanguages, contentFragment, richText]
    const [countriesDiv, languagesDiv, contentDiv, richTextDivElement] = allDivs;

    // Extract targeting values
    const countriesCell = countriesDiv?.querySelector('div');
    if (countriesCell) {
      const p = countriesCell.querySelector('p');
      targetCountries = p ? p.textContent.trim() : countriesCell.textContent.trim();
    }

    const languagesCell = languagesDiv?.querySelector('div');
    if (languagesCell) {
      const p = languagesCell.querySelector('p');
      targetLanguages = p ? p.textContent.trim() : languagesCell.textContent.trim();
    }

    // Extract content divs
    contentFragmentDiv = contentDiv;
    richTextDiv = richTextDivElement;
  } else if (allDivs.length === 2) {
    // Content only: [contentFragment, richText]
    const [contentDiv, richTextDivElement] = allDivs;
    contentFragmentDiv = contentDiv;
    richTextDiv = richTextDivElement;
  }

  return {
    targetCountries,
    targetLanguages,
    contentFragmentDiv,
    richTextDiv,
    headerBgColor,
    contentBgColor,
    enableZebraRows,
    zebraRowColor,
  };
}

/**
 * Fetch table data from Content Fragment via Adobe I/O Runtime API
 * @param {string} contentPath - The path to the content fragment
 * @param {boolean} bypassCache - Whether to bypass cache
 * @returns {Promise<Object|null>} The GraphQL response data or null
 */
async function fetchContentFragment(contentPath, bypassCache = false) {
  try {
    const envConfig = await getEnvironmentConfig();

    const requestBody = {
      action: 'getContentFragments',
      site: envConfig.site,
      query: envConfig.queryName,
      variables: { path: contentPath },
      bypassCache,
    };

    const response = await fetch(envConfig.apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    return null;
  }
}

/**
* Extract table from Content Fragment GraphQL response
* @param {Object} graphqlData - The GraphQL response data
* @returns {HTMLTableElement|null} The extracted table or null
*/
function extractTableFromGraphQL(graphqlData) {
  // Handle nested data structure: response.data.data.tablesList (Adobe I/O Runtime wrapper)
  const tablesData = graphqlData?.data?.data?.tablesList || graphqlData?.data?.tablesList;

  if (!tablesData?.items?.length) {
    return null;
  }

  const firstItem = tablesData.items[0];
  const htmlString = firstItem?.table?.html;

  if (!htmlString) {
    return null;
  }

  // Parse HTML string to DOM
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, 'text/html');
  const table = doc.querySelector('table');

  if (table && table.rows && table.rows.length > 0) {
    return table;
  }

  return null;
}

/**
 * Extract table from Rich Text content
 * @param {HTMLElement} richTextDiv - The rich text container div
 * @returns {HTMLTableElement|null} The extracted table or null
 */
function extractTableFromRichText(richTextDiv) {
  if (!richTextDiv) return null;

  const preCode = richTextDiv.querySelector('pre code');
  if (preCode && preCode.textContent.trim()) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(preCode.textContent, 'text/html');
    return doc.querySelector('table');
  }

  return null;
}

/**
 * Transform image paths to absolute URLs using AEM Cloud base URL
 * @param {HTMLTableElement} table - The table element
 * @param {string} aemCloudBaseUrl - The AEM Cloud publish base URL
 * @returns {HTMLTableElement} The table with transformed image URLs
 */
function transformImagePaths(table, aemCloudBaseUrl) {
  if (!table || !aemCloudBaseUrl) return table;

  // Find all images in the table
  const images = table.querySelectorAll('img');
  images.forEach((img) => {
    const src = img.getAttribute('src');
    const dataContent = img.getAttribute('data-content');
    // Transform src attribute if it starts with /content/dam
    if (src && src.startsWith('/content/dam')) {
      img.setAttribute('src', `${aemCloudBaseUrl}${src}`);
    }
    // Transform data-content attribute if it starts with /content/dam
    if (dataContent && dataContent.startsWith('/content/dam')) {
      img.setAttribute('data-content', `${aemCloudBaseUrl}${dataContent}`);
    }
  });

  return table;
}

/**
 * Remove specific style properties from a style attribute string
 * @param {string} styleString - The original style attribute value
 * @param {Array<string>} removeProps - Array of property names to remove
 * @returns {string} Cleaned style string without the unwanted properties
 */
function cleanStyleAttribute(styleString, removeProps) {
  if (!styleString) return '';

  // Parse style string into individual declarations
  const declarations = styleString
    .split(';')
    .map((decl) => decl.trim())
    .filter((decl) => decl.length > 0);

  // Filter out unwanted properties
  const cleaned = declarations.filter((decl) => {
    const propName = decl.split(':')[0].trim().toLowerCase();
    return !removeProps.some((removeProp) => propName === removeProp.toLowerCase());
  });

  return cleaned.join('; ');
}

/**
 * Clean table HTML while removing only specific inline styles
 * @param {HTMLTableElement} table
 * @param {string} aemCloudBaseUrl - The AEM Cloud publish base URL (optional)
 * @returns {HTMLTableElement|null}
 */
function cleanTable(table, aemCloudBaseUrl = '') {
  if (!table) return null;

  // Lista de estilos que queremos ELIMINAR (el resto se mantiene)
  const REMOVE_STYLES = [
    'width',
    'height',
    'min-width',
    'max-width',
    'min-height',
    'max-height',
  ];

  // Remove colgroup
  table.querySelectorAll('colgroup').forEach((el) => el.remove());

  // Remove table-level attributes
  [
    'width',
    'cellpadding',
    'cellspacing',
  ].forEach((attr) => table.removeAttribute(attr));

  // Clean table-level styles - remove only unwanted ones
  const tableStyle = table.getAttribute('style');
  if (tableStyle) {
    const cleanedStyle = cleanStyleAttribute(tableStyle, REMOVE_STYLES);
    if (cleanedStyle) {
      table.setAttribute('style', cleanedStyle);
    } else {
      table.removeAttribute('style');
    }
  }

  // Clean rows - remove only unwanted styles
  table.querySelectorAll('tr').forEach((row) => {
    const rowStyle = row.getAttribute('style');
    if (rowStyle) {
      const cleanedStyle = cleanStyleAttribute(rowStyle, REMOVE_STYLES);
      if (cleanedStyle) {
        row.setAttribute('style', cleanedStyle);
      } else {
        row.removeAttribute('style');
      }
    }
  });

  // Clean cells - remove only unwanted styles
  table.querySelectorAll('th, td').forEach((cell) => {
    const cellStyle = cell.getAttribute('style');
    if (cellStyle) {
      const cleanedStyle = cleanStyleAttribute(cellStyle, REMOVE_STYLES);
      if (cleanedStyle) {
        cell.setAttribute('style', cleanedStyle);
      } else {
        cell.removeAttribute('style');
      }
    }

    // Normalize &nbsp;
    cell.innerHTML = cell.innerHTML.replace(/&nbsp;/g, ' ');

    // Remove trailing <br> tags
    cell.innerHTML = cell.innerHTML.replace(/<br\s*\/?>\s*$/gi, '').trim();
  });

  // Transform image paths to absolute URLs if AEM Cloud base URL is provided
  if (aemCloudBaseUrl) {
    transformImagePaths(table, aemCloudBaseUrl);
  }

  return table;
}

/**
 * Build a complete matrix from table rows, handling both colspan and rowspan
 * @param {Array} rows - Array of table rows
 * @param {number} numColumns - Number of columns in the table
 * @returns {Array} 2D matrix where matrix[row][col] contains cell data
 */
function buildTableMatrix(rows, numColumns) {
  const matrix = [];

  // Initialize matrix with nulls
  for (let r = 0; r < rows.length; r += 1) {
    matrix[r] = new Array(numColumns).fill(null);
  }

  rows.forEach((row, rowIndex) => {
    let colIndex = 0;

    Array.from(row.cells).forEach((cell) => {
      // Find next available column in this row
      while (colIndex < numColumns && matrix[rowIndex][colIndex] !== null) {
        colIndex += 1;
      }

      const colspan = parseInt(cell.getAttribute('colspan') || '1', 10);
      const rowspan = parseInt(cell.getAttribute('rowspan') || '1', 10);

      const cellData = {
        content: cell.innerHTML,
        style: cell.getAttribute('style') || '',
        colspan,
        rowspan,
      };

      // Fill matrix cells covered by this cell (colspan x rowspan area)
      for (let r = 0; r < rowspan; r += 1) {
        for (let c = 0; c < colspan; c += 1) {
          if (rowIndex + r < rows.length && colIndex + c < numColumns) {
            matrix[rowIndex + r][colIndex + c] = cellData;
          }
        }
      }

      colIndex += colspan;
    });
  });

  return matrix;
}

/**
 * Build header groups from a header row, taking into account colspan values
 * @param {HTMLTableRowElement} headerRow - Table header row element
 * @returns {Object} Object containing groups array and total number of columns
 */
function buildHeaderGroups(headerRow) {
  const groups = [];
  let colPos = 0;

  Array.from(headerRow.cells).forEach((cell) => {
    const span = parseInt(cell.getAttribute('colspan') || '1', 10);
    groups.push({
      label: cell.innerHTML,
      style: cell.getAttribute('style') || '',
      start: colPos,
      span,
    });
    colPos += span;
  });

  return { groups, totalColumns: colPos };
}

/**
 * Expand a data row into multiple records based on header groups and colspan logic
 * @param {Array} expandedRow - Array of expanded cells (after colspan/rowspan processing)
 * @param {Array} groups - Header groups with start index and span information
 * @returns {Array} Array of records where each record represents a logical row
 */
function expandRowIntoRecords(expandedRow, groups) {
  // Determine how many records this row represents
  let splitCount = 1;

  const groupMeta = groups.map((g) => {
    const vals = [];
    for (let i = 0; i < g.span; i += 1) {
      vals.push(expandedRow[g.start + i] || null);
    }

    // A group "splits" if it spans > 1 and contents differ across its slots
    const contents = vals.map((v) => (v?.content ?? '').trim());
    const unique = new Set(contents.filter((c) => c !== ''));

    const shouldSplit = g.span > 1 && unique.size > 1;

    if (shouldSplit) splitCount = Math.max(splitCount, g.span);

    return { ...g, vals, shouldSplit };
  });

  // Build records
  const records = [];

  for (let r = 0; r < splitCount; r += 1) {
    const record = groupMeta.map((g) => {
      // If group splits: pick slot r (fallback to slot 0)
      // If group doesn't split: always pick slot 0
      const picked = g.shouldSplit ? (g.vals[r] || g.vals[0] || null) : (g.vals[0] || null);

      return {
        headerLabel: g.label,
        headerStyle: g.style,
        content: picked?.content || '',
        style: picked?.style || '',
      };
    });

    records.push(record);
  }

  return records;
}

/**
 * Transform table for tablet view (2 columns per record)
 * Applies matrix reorganization: NxM → blocks of Mx2 (partial transposition)
 * @param {HTMLTableElement} table - The original table
 * @returns {HTMLTableElement} The transformed table for tablet
 */
function transformTableForTablet(table) {
  if (!table || !table.rows || table.rows.length < 2) return table;

  const originalRows = Array.from(table.rows);
  const headerRow = originalRows[0];
  const dataRows = originalRows.slice(1);

  // 1) Build header groups and total "visual columns" considering colspans in header
  const { groups, totalColumns } = buildHeaderGroups(headerRow);

  // 2) Build expanded matrix for the data rows using totalColumns
  const matrix = buildTableMatrix(dataRows, totalColumns);

  // 3) Expand each data row into 1..N "records" based on splitting logic
  const records = [];
  matrix.forEach((expandedRow) => {
    const rowRecords = expandRowIntoRecords(expandedRow, groups);
    rowRecords.forEach((rec) => records.push(rec));
  });

  // 4) Render tablet table: 2 records per block, rows = header groups
  const newTable = document.createElement('table');
  newTable.className = table.className || '';
  if (table.getAttribute('style')) newTable.setAttribute('style', table.getAttribute('style'));

  const tbody = document.createElement('tbody');

  for (let i = 0; i < records.length; i += 2) {
    const record1 = records[i];
    const record2 = i + 1 < records.length ? records[i + 1] : null;
    const blockIndex = Math.floor(i / 2);

    for (let gIndex = 0; gIndex < groups.length; gIndex += 1) {
      const row = document.createElement('tr');

      const cellType = gIndex === 0 ? 'th' : 'td';

      // ----- cell 1 -----
      const c1 = document.createElement(cellType);
      c1.setAttribute('data-record', '1');
      c1.setAttribute('data-block', blockIndex.toString());
      c1.setAttribute('data-row', gIndex.toString());

      const headerSpan1 = document.createElement('span');
      headerSpan1.className = 'table-cell-header';
      const separator1 = cellType === 'th' ? ':' : '';
      headerSpan1.innerHTML = `<span>${record1[gIndex].headerLabel}${separator1}</span>`;

      const contentSpan1 = document.createElement('span');
      contentSpan1.className = 'table-cell-content';
      contentSpan1.innerHTML = record1[gIndex].content || '';

      // Apply styles only to content span, not to the cell
      if (record1[gIndex].style) {
        contentSpan1.setAttribute('style', record1[gIndex].style);
      }

      c1.appendChild(headerSpan1);
      c1.appendChild(document.createTextNode(' '));
      c1.appendChild(contentSpan1);

      row.appendChild(c1);

      // ----- cell 2 -----
      const c2 = document.createElement(cellType);
      c2.setAttribute('data-record', '2');
      c2.setAttribute('data-block', blockIndex.toString());
      c2.setAttribute('data-row', gIndex.toString());

      if (record2) {
        const headerSpan2 = document.createElement('span');
        headerSpan2.className = 'table-cell-header';
        const separator2 = cellType === 'th' ? ':' : '';
        headerSpan2.innerHTML = `<span>${record2[gIndex].headerLabel}${separator2}</span>`;

        const contentSpan2 = document.createElement('span');
        contentSpan2.className = 'table-cell-content';
        contentSpan2.innerHTML = record2[gIndex].content || '';

        // Apply styles only to content span, not to the cell
        if (record2[gIndex].style) {
          contentSpan2.setAttribute('style', record2[gIndex].style);
        }

        c2.appendChild(headerSpan2);
        c2.appendChild(document.createTextNode(' '));
        c2.appendChild(contentSpan2);
      } else {
        c2.innerHTML = '';
      }

      row.appendChild(c2);

      tbody.appendChild(row);
    }
  }

  newTable.appendChild(tbody);
  return newTable;
}

/**
 * Build table for mobile view (1 column, vertical layout)
 * Creates a new table specifically for mobile with proper ordering
 * @param {HTMLTableElement} table - The original table
 * @returns {HTMLTableElement} The new table for mobile
 */
function buildTableForMobile(table) {
  if (!table || !table.rows || table.rows.length < 2) return table;

  const originalRows = Array.from(table.rows);
  const headerRow = originalRows[0];
  const dataRows = originalRows.slice(1);

  const { groups, totalColumns } = buildHeaderGroups(headerRow);

  const matrix = buildTableMatrix(dataRows, totalColumns);

  const records = [];
  matrix.forEach((expandedRow) => {
    const rowRecords = expandRowIntoRecords(expandedRow, groups);
    rowRecords.forEach((rec) => records.push(rec));
  });

  const newTable = document.createElement('table');
  newTable.className = table.className || '';
  if (table.getAttribute('style')) {
    newTable.setAttribute('style', table.getAttribute('style'));
  }

  const tbody = document.createElement('tbody');

  records.forEach((record, recordIndex) => {
    for (let gIndex = 0; gIndex < groups.length; gIndex += 1) {
      const row = document.createElement('tr');

      const cellType = gIndex === 0 ? 'th' : 'td';
      const cell = document.createElement(cellType);

      cell.setAttribute('data-record', recordIndex.toString());
      cell.setAttribute('data-row', gIndex.toString());

      // Header
      const headerSpan = document.createElement('span');
      headerSpan.className = 'table-cell-header';
      const separator = cellType === 'th' ? ':' : '';
      headerSpan.innerHTML = `<span>${record[gIndex].headerLabel}${separator}</span>`;

      // Content
      const contentSpan = document.createElement('span');
      contentSpan.className = 'table-cell-content';
      contentSpan.innerHTML = record[gIndex].content || '';

      // Apply styles only to content span, not to the cell
      if (record[gIndex].style) {
        contentSpan.setAttribute('style', record[gIndex].style);
      }

      cell.appendChild(headerSpan);
      cell.appendChild(document.createTextNode(' '));
      cell.appendChild(contentSpan);

      row.appendChild(cell);
      tbody.appendChild(row);
    }
  });

  newTable.appendChild(tbody);
  return newTable;
}

/**
 * Enhance table accessibility for screen readers and keyboard navigation
 * @param {HTMLTableElement} table - The table to enhance
 * @param {string} tableType - Type of table: 'desktop', 'tablet', or 'mobile'
 */
function enhanceTableAccessibility(table, tableType = 'desktop') {
  if (!table || !table.rows) return;

  // Handle caption: if exists, make it sr-only; if not, create one
  let caption = table.querySelector('caption');
  if (caption) {
    // Caption already exists from fragment, make it visually hidden
    caption.className = 'sr-only';
  } else {
    // Create caption only if it doesn't exist
    caption = document.createElement('caption');
    caption.className = 'sr-only';
    caption.textContent = 'Tabla de información';
    table.insertBefore(caption, table.firstChild);
  }

  // Add aria-label to table
  table.setAttribute('role', 'table');
  table.setAttribute('aria-label', caption.textContent || 'Tabla de datos');

  const rows = Array.from(table.rows);

  if (tableType === 'desktop') {
    // Desktop: Add scope to header cells
    if (rows.length > 0) {
      const headerRow = rows[0];
      Array.from(headerRow.cells).forEach((th) => {
        if (th.tagName === 'TH') {
          th.setAttribute('scope', 'col');
          th.setAttribute('role', 'columnheader');
        }
      });
    }

    // Add role to body rows and cells
    rows.slice(1).forEach((row) => {
      row.setAttribute('role', 'row');
      Array.from(row.cells).forEach((cell) => {
        cell.setAttribute('role', 'cell');
      });
    });
  } else {
    // Tablet/Mobile: Add aria-labels for better screen reader support
    rows.forEach((row) => {
      row.setAttribute('role', 'row');
      Array.from(row.cells).forEach((cell) => {
        const headerSpan = cell.querySelector('.table-cell-header');
        const contentSpan = cell.querySelector('.table-cell-content');
        if (headerSpan && contentSpan) {
          const headerText = headerSpan.textContent.replace(':', '').trim();
          const contentText = contentSpan.textContent.trim();
          cell.setAttribute('aria-label', `${headerText}: ${contentText}`);
        }

        if (cell.tagName === 'TH') {
          cell.setAttribute('role', 'rowheader');
          cell.setAttribute('scope', 'row');
        } else {
          cell.setAttribute('role', 'cell');
        }
      });
    });
  }
}

/**
 * Mark cells in the last column with a data attribute
 * Handles rowspan and colspan correctly by building a position matrix
 * @param {HTMLTableElement} table - The table to mark
 */
function markLastColumnCells(table) {
  if (!table || !table.rows || table.rows.length === 0) return;

  const rows = Array.from(table.rows);
  // Find the maximum number of columns
  let maxCols = 0;
  rows.forEach((row) => {
    let colCount = 0;
    Array.from(row.cells).forEach((cell) => {
      const colspan = parseInt(cell.getAttribute('colspan') || '1', 10);
      colCount += colspan;
    });
    if (colCount > maxCols) maxCols = colCount;
  });

  // Build a matrix to track which cell occupies each position
  const matrix = [];
  for (let r = 0; r < rows.length; r += 1) {
    matrix[r] = new Array(maxCols).fill(null);
  }

  rows.forEach((row, rowIndex) => {
    let colIndex = 0;

    Array.from(row.cells).forEach((cell) => {
      // Find next available column in this row
      while (colIndex < maxCols && matrix[rowIndex][colIndex] !== null) {
        colIndex += 1;
      }

      const colspan = parseInt(cell.getAttribute('colspan') || '1', 10);
      const rowspan = parseInt(cell.getAttribute('rowspan') || '1', 10);

      // Fill matrix cells covered by this cell
      for (let r = 0; r < rowspan; r += 1) {
        for (let c = 0; c < colspan; c += 1) {
          if (rowIndex + r < rows.length && colIndex + c < maxCols) {
            matrix[rowIndex + r][colIndex + c] = cell;
          }
        }
      }

      colIndex += colspan;
    });
  });

  // Mark cells that occupy the last column position
  const lastColIndex = maxCols - 1;
  for (let r = 0; r < rows.length; r += 1) {
    const cell = matrix[r][lastColIndex];
    if (cell) {
      cell.setAttribute('data-last-column', 'true');
    }
  }
}

/**
 * Mark cells with rowspan that visually end in the last row
 * @param {HTMLTableElement} table - The table to mark
 */
function markCellsEndingInLastRow(table) {
  const tbody = table.querySelector('tbody');
  if (!tbody) return;

  const rows = Array.from(tbody.querySelectorAll('tr'));
  if (rows.length === 0) return;

  const lastRowIndex = rows.length - 1;

  // Iterate through all rows to find cells with rowspan
  rows.forEach((row, rowIndex) => {
    const cells = row.querySelectorAll('td');
    cells.forEach((cell) => {
      const rowspan = parseInt(cell.getAttribute('rowspan'), 10) || 1;
      const cellEndRow = rowIndex + rowspan - 1;

      // If this cell ends in the last row, mark it
      if (cellEndRow === lastRowIndex) {
        cell.setAttribute('data-ends-in-last-row', 'true');
      }
    });
  });
}

/**
 * Apply zebra rows styling to table
 * @param {HTMLTableElement} table - The table element
 * @param {string} zebraColor - Background color for even rows
 */
function applyZebraRows(table, zebraColor) {
  if (!table || !zebraColor) return;

  const rows = table.querySelectorAll('tbody tr');
  rows.forEach((row, index) => {
    // Apply color to even rows (index 1, 3, 5, etc.)
    if ((index + 1) % 2 === 0) {
      const cells = row.querySelectorAll('td');
      cells.forEach((td) => {
        const currentStyle = td.getAttribute('style') || '';
        const newStyle = currentStyle ? `${currentStyle}; background-color: ${zebraColor};` : `background-color: ${zebraColor};`;
        td.setAttribute('style', newStyle);
      });
    }
  });
}

/**
 * Apply custom background colors to table cells
 * @param {HTMLTableElement} table - The table element
 * @param {string|null} headerBgColor - Background color for header cells (th)
 * @param {string|null} contentBgColor - Background color for content cells (td)
 * @param {boolean} enableZebra - Whether to enable zebra rows
 * @param {string|null} zebraColor - Background color for zebra rows
 */
function applyCustomColors(table, headerBgColor, contentBgColor, enableZebra, zebraColor) {
  if (!table) return;

  // Apply header background color to all th elements
  if (headerBgColor) {
    table.querySelectorAll('th').forEach((th) => {
      const currentStyle = th.getAttribute('style') || '';
      const newStyle = currentStyle ? `${currentStyle}; background-color: ${headerBgColor};` : `background-color: ${headerBgColor};`;
      th.setAttribute('style', newStyle);
    });
  }

  // Apply content background color to all td elements (base color)
  if (contentBgColor && !enableZebra) {
    table.querySelectorAll('td').forEach((td) => {
      const currentStyle = td.getAttribute('style') || '';
      const newStyle = currentStyle ? `${currentStyle}; background-color: ${contentBgColor};` : `background-color: ${contentBgColor};`;
      td.setAttribute('style', newStyle);
    });
  }

  // Apply zebra rows if enabled
  if (enableZebra && zebraColor) {
    applyZebraRows(table, zebraColor);
  }
}

/**
 * Render table in the block
 * @param {HTMLElement} block - The block element
 * @param {HTMLTableElement} table - The table to render
 * @param {string|null} headerBgColor - Background color for header cells
 * @param {string|null} contentBgColor - Background color for content cells
 * @param {boolean} enableZebra - Whether to enable zebra rows
 * @param {string|null} zebraColor - Background color for zebra rows
 */
function renderTable(
  block,
  table,
  headerBgColor = null,
  contentBgColor = null,
  enableZebra = false,
  zebraColor = null,
) {
  block.innerHTML = '';
  if (table) {
    // Clone table for desktop version
    const desktopTable = table.cloneNode(true);
    desktopTable.classList.add('table-desktop');
    applyCustomColors(desktopTable, headerBgColor, contentBgColor, enableZebra, zebraColor);
    enhanceTableAccessibility(desktopTable, 'desktop');
    markLastColumnCells(desktopTable);
    markCellsEndingInLastRow(desktopTable);
    // Create tablet version with 2 columns per record
    const tabletTable = transformTableForTablet(table.cloneNode(true));
    tabletTable.classList.add('table-tablet');
    applyCustomColors(tabletTable, headerBgColor, contentBgColor, enableZebra, zebraColor);
    enhanceTableAccessibility(tabletTable, 'tablet');
    markLastColumnCells(tabletTable);
    markCellsEndingInLastRow(tabletTable);
    // Create mobile version with 1 column, vertical layout
    const mobileTable = buildTableForMobile(table.cloneNode(true));
    mobileTable.classList.add('table-mobile');
    applyCustomColors(mobileTable, headerBgColor, contentBgColor, enableZebra, zebraColor);
    enhanceTableAccessibility(mobileTable, 'mobile');

    block.appendChild(desktopTable);
    block.appendChild(tabletTable);
    block.appendChild(mobileTable);
  } else {
    block.innerHTML = '<p>No table content available</p>';
  }
}

export default async function decorate(block) {
  // Extract targeting and content data from block structure
  const {
    targetCountries,
    targetLanguages,
    contentFragmentDiv,
    richTextDiv,
    headerBgColor,
    contentBgColor,
    enableZebraRows,
    zebraRowColor,
  } = extractTableData(block);

  // Check targeting (country/language filtering)
  if (!shouldShowByTargeting(targetCountries, targetLanguages)) {
    hideBlockWithSection(block);
    return;
  }

  let table = null;

  const cfLink = contentFragmentDiv?.querySelector('a[href*="/content/dam"]');
  if (cfLink) {
    // Extract content fragment path from the link
    const contentPath = cfLink.getAttribute('href') || cfLink.textContent?.trim();

    if (contentPath) {
      const isAuthor = isAuthorEnvironment();
      const envConfig = await getEnvironmentConfig();

      // ALWAYS bypass cache to get the latest content
      // Change this to 'false' if you want to use cache in production
      const bypassCache = true;

      // Fetch data from Adobe I/O Runtime API
      const graphqlData = await fetchContentFragment(contentPath, bypassCache);

      if (graphqlData) {
        const rawTable = extractTableFromGraphQL(graphqlData);
        table = cleanTable(rawTable, envConfig.aemCloudBaseUrl);

        // Set up Universal Editor attributes for author environment
        if (isAuthor && contentPath) {
          const itemId = `urn:aemconnection:${contentPath}/jcr:content/data/master`;
          block.setAttribute('data-aue-resource', itemId);
          block.setAttribute('data-aue-type', 'container');
          block.setAttribute('data-aue-label', 'Table');
        }
      } else {
        // eslint-disable-next-line no-console
        console.warn('[Tables] No GraphQL data received');
      }
    }
  } else {
    table = extractTableFromRichText(richTextDiv);
  }
  renderTable(block, table, headerBgColor, contentBgColor, enableZebraRows, zebraRowColor);
}
