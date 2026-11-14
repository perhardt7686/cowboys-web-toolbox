import {boardTime, button, el, field, persistentFold, reportError, statusLine} from './family-board-core.mjs?v=family3';

const categories = [['groceries', 'Groceries'], ['household', 'Household']];

export function makeFridge({rpc}) {
  const panel = persistentFold('family-fridge', 'Family Fridge');
  const summary = el('span', 'family-fold-meta');
  panel.querySelector('summary').append(summary);
  const shell = el('div', 'family-panel-body');
  const status = statusLine('Open the fridge to load the list.');
  const list = el('div', 'family-fridge-list');
  const toolbar = el('div', 'family-controls');
  const add = button('Add an item', () => showEditor());
  const refreshButton = button('Refresh', () => void refresh(true));
  const clear = button('Clear picked-up items', () => {
    if (window.confirm('Clear the items marked picked up on this list?')) {
      void change('clear_done', {p_updated_at: newest}, items.filter(item => !item.done));
    }
  });
  const editor = el('div', 'family-editor');
  toolbar.append(add, refreshButton, clear);
  shell.append(toolbar, editor, status, list);
  panel.append(shell);

  let items = [], newest = null, loaded = false, busy = false, generation = 0, active = true;
  let loading = false, queued = false, needsRefresh = true, savedMessage = '';
  const read = data => {
    items = data.items || [];
    newest = items.reduce((date, item) => date > item.updated_at ? date : item.updated_at, '');
    loaded = true;
    render();
  };
  function render() {
    add.disabled = busy || !loaded;
    refreshButton.disabled = busy;
    clear.disabled = busy || !items.some(item => item.done);
    const needed = items.filter(item => !item.done).length;
    summary.textContent = loaded ? needed + ' to pick up' : '';
    list.replaceChildren();
    for (const [key, title] of categories) {
      const section = el('section', 'family-fridge-category');
      section.append(el('h3', '', title));
      const group = items.filter(item => item.category === key);
      if (!group.length && loaded) section.append(el('p', 'family-status', 'List is empty.'));
      const rows = el('ul', 'family-item-list');
      for (const item of group) {
        const row = el('li', item.done ? 'family-item is-done' : 'family-item');
        const caption = el('div', 'family-item-copy');
        const check = el('input');
        check.type = 'checkbox';
        check.checked = item.done;
        check.disabled = busy;
        check.dataset.familyCheck = String(item.id);
        check.addEventListener('change', async () => {
          const done = check.checked;
          await change('check', {p_id: item.id, p_done: done, p_updated_at: item.updated_at},
            items.map(previous => previous.id === item.id ? {...previous, done} : previous));
          list.querySelector('[data-family-check="' + item.id + '"]')?.focus();
        });
        caption.append(field(item.name + (item.quantity ? ' · ' + item.quantity : ''), check));
        if (item.notes) caption.append(el('p', 'family-item-note', item.notes));
        const meta = el('small', '', (item.done ? 'Picked up' : 'Needed') + ' · ' + boardTime(item.updated_at));
        caption.append(meta);
        const tools = el('div', 'family-controls');
        const edit = button('Edit', () => showEditor(item), {'aria-label': 'Edit ' + item.name});
        const remove = button('Remove', () => {
          if (window.confirm('Remove ' + item.name + ' from the fridge?')) {
            void change('remove', {p_id: item.id, p_updated_at: item.updated_at}, items.filter(old => old.id !== item.id));
          }
        }, {'aria-label': 'Remove ' + item.name});
        edit.disabled = remove.disabled = busy;
        tools.append(edit, remove);
        row.append(caption, tools);
        rows.append(row);
      }
      section.append(rows);
      list.append(section);
    }
  }
  function showEditor(item) {
    if (busy) return;
    const form = el('form', 'family-form');
    const select = el('select');
    select.name = 'category';
    for (const [key, title] of categories) {
      const option = el('option', '', title);
      option.value = key;
      select.append(option);
    }
    select.value = item?.category || 'groceries';
    const name = el('input');
    name.name = 'name';
    name.required = true;
    name.maxLength = 100;
    name.value = item?.name || '';
    const quantity = el('input');
    quantity.name = 'quantity';
    quantity.maxLength = 40;
    quantity.value = item?.quantity || '';
    const notes = el('textarea');
    notes.name = 'notes';
    notes.maxLength = 280;
    notes.rows = 2;
    notes.value = item?.notes || '';
    const save = el('button', '', item ? 'Save changes' : 'Add to fridge');
    save.type = 'submit';
    const cancel = button('Cancel', () => { editor.replaceChildren(); add.focus(); });
    form.append(field('Item', name), field('Category', select), field('Quantity', quantity), field('Notes', notes), save, cancel);
    editor.replaceChildren(form);
    name.focus();
    form.addEventListener('submit', async event => {
      event.preventDefault();
      if (busy) return;
      const value = new FormData(form);
      save.disabled = cancel.disabled = true;
      const ok = await change(item ? 'edit' : 'add', {
        p_id: item?.id || null, p_updated_at: item?.updated_at || null,
        p_category: value.get('category'), p_name: value.get('name'),
        p_quantity: value.get('quantity'), p_notes: value.get('notes')
      });
      save.disabled = cancel.disabled = false;
      if (ok && form.isConnected) { editor.replaceChildren(); add.focus(); }
    });
  }
  async function refresh(manual = false) {
    if (!active || !panel.open) { needsRefresh = true; return; }
    if (loading || busy) { queued = true; return; }
    loading = true;
    needsRefresh = false;
    const ticket = generation;
    if (!loaded || manual) status.textContent = 'Refreshing the fridge…';
    try {
      const {data, error} = await rpc('community_family_fridge_state');
      if (error) throw error;
      if (!active || generation !== ticket) return;
      read(data);
      status.textContent = manual ? 'Fridge refreshed.' : savedMessage;
    } catch (error) {
      if (active && generation === ticket) {
        status.textContent = reportError(error, loaded ? 'Showing the last loaded list. Refresh to reconnect.' : 'The fridge list could not load. Try Refresh.');
        needsRefresh = true;
      }
    } finally {
      loading = false;
      if (active && queued) { queued = false; void refresh(); }
    }
  }
  async function change(action, params, preview) {
    if (!active || busy) return false;
    busy = true;
    generation += 1;
    savedMessage = '';
    const previous = items;
    if (preview) items = preview;
    render();
    status.textContent = 'Saving…';
    let saved = false;
    try {
      const {data, error} = await rpc('community_family_fridge_update', {p_action: action, ...params});
      if (error) throw error;
      if (!active) return false;
      read(data);
      status.textContent = savedMessage = 'Saved.';
      saved = true;
    } catch (error) {
      if (!active) return false;
      items = previous;
      status.textContent = savedMessage = reportError(error, 'Could not save this change. Your previous list was restored.');
      if (error?.code === '40001') queued = true;
    } finally {
      busy = false;
      if (active) {
        render();
        if (queued) { queued = false; void refresh(); }
      }
    }
    return saved;
  }
  panel.addEventListener('toggle', () => { if (panel.open && (!loaded || needsRefresh)) void refresh(); });
  render();
  return {panel, refresh, dispose: () => { active = false; }};
}
