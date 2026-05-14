import { useState } from 'react';
import { STAFF as DEFAULT_STAFF, PRODUCTS as DEFAULT_PRODUCTS, KOLS as DEFAULT_KOLS, SOURCES as DEFAULT_SOURCES } from '../data/mockData';

function load(key, def) {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : def;
  } catch { return def; }
}

function save(key, val) {
  localStorage.setItem(key, JSON.stringify(val));
}

export function useSettings() {
  const [staff, setStaffState] = useState(() => load('db_staff', DEFAULT_STAFF));
  const [products, setProductsState] = useState(() => load('db_products', DEFAULT_PRODUCTS));
  const [kols, setKolsState] = useState(() => load('db_kols', DEFAULT_KOLS));
  const [sources, setSourcesState] = useState(() => load('db_sources', DEFAULT_SOURCES));
  const [sheetsApiKey, setSheetsApiKeyState] = useState(() => load('db_sheets_key', ''));
  const [companyName, setCompanyNameState] = useState(() => load('db_company_name', 'DetoxBlanc'));
  const [scriptUrl, setScriptUrlState] = useState(() => load('db_script_url', ''));

  const setStaff = v => { save('db_staff', v); setStaffState(v); };
  const setProducts = v => { save('db_products', v); setProductsState(v); };
  const setKols = v => { save('db_kols', v); setKolsState(v); };
  const setSources = v => { save('db_sources', v); setSourcesState(v); };
  const setSheetsApiKey = v => { save('db_sheets_key', v); setSheetsApiKeyState(v); };
  const setCompanyName = v => { save('db_company_name', v); setCompanyNameState(v); };
  const setScriptUrl = v => { save('db_script_url', v); setScriptUrlState(v); };

  return { staff, setStaff, products, setProducts, kols, setKols, sources, setSources, sheetsApiKey, setSheetsApiKey, companyName, setCompanyName, scriptUrl, setScriptUrl };
}
