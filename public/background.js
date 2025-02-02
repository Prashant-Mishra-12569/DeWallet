// Listen for installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('DeWallet Extension Installed');
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'GET_WALLET_DATA') {
    // Handle wallet data requests
    chrome.storage.local.get(['wallets', 'currentWallet'], (result) => {
      sendResponse(result);
    });
    return true;
  }
}); 