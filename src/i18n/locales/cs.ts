export default {
  // App
  appName: 'QR Čtečka',

  // Scanner screen
  scanner: {
    title: 'Skenovat',
    pointCamera: 'Namiřte kameru na QR kód',
    tapToScan: 'Klepněte pro skenování z galerie',
    flash: 'Blesk',
    flashOn: 'Blesk zapnutý',
    flashOff: 'Blesk vypnutý',
    flipCamera: 'Otočit kameru',
    gallery: 'Galerie',
    scanning: 'Skenuji...',
    noQrFound: 'Žádný kód nenalezen',
    supportsFormats: 'QR · EAN-13 · EAN-8 · UPC · Code 128 · Code 39 · ITF-14 · PDF417',
    permissionRequired: 'Vyžadováno oprávnění',
    cameraPermission: 'Pro skenování QR kódů kamerou je potřeba oprávnění.',
    grantPermission: 'Udělit oprávnění',
    openSettings: 'Otevřít nastavení',
  },

  // Result screen
  result: {
    title: 'Výsledek',
    content: 'Obsah',
    type: 'Typ',
    openLink: 'Otevřít odkaz',
    copy: 'Kopírovat',
    copied: 'Zkopírováno!',
    share: 'Sdílet',
    scanAgain: 'Skenovat znovu',
    saveToHistory: 'Uložit do historie',
    saved: 'Uloženo!',

    // QR types
    types: {
      url: 'Webová adresa',
      email: 'E-mail',
      phone: 'Telefon',
      sms: 'SMS',
      wifi: 'Wi-Fi',
      vcard: 'Kontakt',
      text: 'Text',
      geo: 'Poloha',
      calendar: 'Událost',
      barcode: 'Čárový kód',
      unknown: 'Neznámý',
    },

    // Actions
    openEmail: 'Otevřít e-mail',
    callPhone: 'Zavolat',
    sendSms: 'Poslat SMS',
    connectWifi: 'Připojit k Wi-Fi',
    addContact: 'Přidat kontakt',
    openMap: 'Otevřít v mapách',
    addCalendar: 'Přidat do kalendáře',
  },

  // History screen
  history: {
    title: 'Historie',
    empty: 'Historie je prázdná',
    emptySubtitle: 'Naskenované QR kódy se zobrazí zde',
    clearAll: 'Vymazat vše',
    clearConfirm: 'Opravdu vymazat celou historii?',
    clearYes: 'Vymazat',
    clearNo: 'Zrušit',
    today: 'Dnes',
    yesterday: 'Včera',
    deleteItem: 'Smazat',
    noMore: 'Konec historie',
    exportAll: 'Exportovat vše',
  },

  // Settings screen
  settings: {
    title: 'Nastavení',
    language: 'Jazyk',
    appearance: 'Vzhled',
    darkMode: 'Tmavý režim',
    haptics: 'Vibrace',
    hapticsFeedback: 'Haptická odezva',
    sound: 'Zvuk',
    soundFeedback: 'Zvukový signál při skenování',
    autoOpen: 'Automaticky otevírat',
    autoOpenLinks: 'Automaticky otevírat webové adresy',
    saveHistory: 'Ukládat historii',
    saveHistoryDesc: 'Ukládat naskenované kódy do historie',
    about: 'O aplikaci',
    version: 'Verze',
    privacy: 'Zásady ochrany soukromí',
    openSource: 'Zdrojový kód',
  },

  // Common
  common: {
    ok: 'OK',
    cancel: 'Zrušit',
    close: 'Zavřít',
    back: 'Zpět',
    error: 'Chyba',
    success: 'Úspěch',
    loading: 'Načítám...',
    unknown: 'Neznámý',
  },
};
