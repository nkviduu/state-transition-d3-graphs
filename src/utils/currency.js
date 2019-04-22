// module.exports = {
//   applyCurrencyHandler,
//   currencyInputFactory,
//   formatNumber,
// }

// applies currencyHandler for contaner,
// inputClassName identifies inputs to be handled as currency
// inputIncomplete will be added to incomplete inputs after change
// onUpdate call back function invoked ofter input and onFocusout events
export function applyCurrencyHandler({
  container,
  inputClassName = 'currency',
  inputIncomplete = 'currency_incomplete',
  onUpdate = () => {},
}) {
  const { onInput, onFocusout } = currencyInputFactory({
    inputClassName,
    inputIncomplete,
  });

  function inputHandler(e) {
    onUpdate(onInput(e));
  }

  function focusHandler(e) {
    onUpdate(onFocusout(e));
  }

  container.addEventListener('input', inputHandler);
  container.addEventListener('focusout', focusHandler);

  return () => {
    container.removeEventListener('input', inputHandler);
    container.removeEventListener('input', focusHandler);
  };
}

/**
 * returns function that takes input event and formats input target as currency
 * by adding commas where required.
 * while editing it keeps caret in the same position
 * it allows to edit also first digit without collapsing following 0's
 * so in editing from 1,000,000 to 2,000,000
 * deletion of 1 will leave  ,000,000 with caret in first position avoiding collapse to 0
 * returned function will return object containing input, inputs numeric value and completion status. If case of input text is  ,000,000 it value will be 0 and complete = false
 */
export function currencyInputFactory({
  inputClassName = 'currency',
  inputIncomplete = 'currency_incomplete',
} = {}) {
  return { onInput, onFocusout };

  function onInput({ target }) {
    const { value } = target;

    if (!target.classList.contains(inputClassName)) {
      return;
    }

    let formattedValue = value.replace(/[^0-9]/g, '');
    const restoreCaret = saveCaretPosition(target);

    if (canUpdate(formattedValue)) {
      formattedValue = formatNumber(formattedValue);
    }

    target.value = formattedValue;
    restoreCaret();

    return {
      input: target,
      value: +value.replace(/[^0-9]/g, ''),
      complete: isComplete(formattedValue),
    };
  }

  function onFocusout({ target }) {
    const { value } = target;

    if (!target.classList.contains(inputClassName)) {
      return;
    }

    let formattedValue = formatNumber(+value.replace(/[^0-9]/g, ''));
    target.value = formattedValue;

    return {
      input: target,
      value: +value.replace(/[^0-9]/g, ''),
      complete: true,
    };
  }

  function canUpdate(ui) {
    const allowEditFirstDigit = '(^(,|)0)';
    const allowEmpty = '(^$)';

    const re = new RegExp(`${allowEditFirstDigit}|${allowEmpty}`);
    return !re.test(ui.value);
  }

  function saveCaretPosition(ui) {
    if (document.activeElement !== ui) {
      return () => {};
    }
    const positonFromEnd = ui.value.length - ui.selectionEnd;
    return () => {
      const pos = Math.max(0, ui.value.length - positonFromEnd);
      ui.setSelectionRange(pos, pos);
    };
  }

  function isComplete(val) {
    return /^\d/.test(val);
  }
}

export function formatNumber(value) {
  return typeof value === 'undefined' || value === ''
    ? ''
    : value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
