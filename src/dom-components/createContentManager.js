import { applyCurrencyHandler, formatNumber } from '../utils/currency.js';

export function createContentManager({
  contentHost,
  data = [],
  onChange = () => {},
  debounceWait = 350,
  formatExistingInput = true,
  title = 'Data Editor',
}) {
  const container =
    typeof contentHost === 'string'
      ? document.querySelector(contentHost)
      : contentHost;
  let tbl, currentData;

  init();

  update(data);

  applyCurrencyHandler({
    container: tbl,
    onUpdate: debounce(res => onChange(getContent()), debounceWait),
  });

  return { update, destroy };

  function debounce(fn, wait) {
    let timeout;
    return function(...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        timeout = null;
        fn.apply(null, args);
      }, wait);
    };
  }

  function update(data) {
    currentData = data || currentData;
    const content = `
      <table>
        ${currentData.map(buildRow).join('')}
      </table>
    `;
    tbl.innerHTML = content;
  }

  function destroy() {}

  function init() {
    const titleEl = document.createElement('h3');
    titleEl.innerHTML = title;
    container.append(titleEl);

    tbl = document.createElement('table');
    container.append(tbl);

    const controls = document.createElement('div');
    container.append(controls);

    const btnAdd = document.createElement('button');
    btnAdd.innerText = '+';
    btnAdd.title = 'Add row for new item';
    btnAdd.classList.add('add');
    btnAdd.addEventListener('click', () => {
      currentData.push(['', '']);
      update();
    });
    controls.append(btnAdd);

    // const btnUpdate = document.createElement('button');
    // btnUpdate.innerText = 'Update';
    // btnUpdate.addEventListener('click', () => {
    //   onChange(getContent());
    // });
    // controls.append(btnUpdate);
  }

  function buildRow(rowData, rowIndex) {
    const rowContent = rowData
      .map(
        (cell, i) => `
      <td>
       <span ${(i && 'class="currency-wrapper"') || ''}>
        <input type="text" value="${i ? formatNumber(cell) : cell}" ${(i &&
          'class="currency"') ||
          ''}>
       </span>
      </td>
      `,
      )
      .join('');
    return `
    <tr>
      ${rowContent}
    </tr>`;
  }

  function getContent() {
    const rows = [...tbl.querySelectorAll('tr')].map(row => {
      return [...row.querySelectorAll('input')].map(input => input.value);
    });

    return rows;
  }
}
