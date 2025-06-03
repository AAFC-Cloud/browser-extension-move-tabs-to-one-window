// Wait for the DOM to be fully loaded before attaching listeners
document.addEventListener('DOMContentLoaded', function() {
    const button = document.getElementById('moveTabsButton');
    const statusElement = document.getElementById('status');
  
    button.addEventListener('click', async () => {
      button.disabled = true; // Disable the button to prevent multiple clicks
      statusElement.textContent = 'Moving tabs...';
      statusElement.style.color = 'gray'; // Indicate processing
  
      try {
        // 1. Get the ID of the current window (where the popup was opened)
        // Use chrome.windows API - Edge is compatible
        const currentWindow = await chrome.windows.getCurrent({ populate: false });
        const targetWindowId = currentWindow.id;
  
        // 2. Get all open windows with their tabs
        // windowTypes: ['normal'] excludes popups, devtools etc.
        const allWindows = await chrome.windows.getAll({ populate: true, windowTypes: ['normal'] });
  
        let tabsMovedCount = 0;
  
        // 3. Iterate through all windows found
        for (const window of allWindows) {
          // If the window is NOT the current/target window
          if (window.id !== targetWindowId) {
            // Iterate through all tabs in this other window
            for (const tab of window.tabs) {
              try {
                // Move the tab to the target window
                // index: -1 means append to the end of the tabs in the target window
                await chrome.tabs.move(tab.id, { windowId: targetWindowId, index: -1 });
                tabsMovedCount++;
                // Add a small delay to avoid overwhelming the browser if moving many tabs
                // await new Promise(resolve => setTimeout(resolve, 20)); // Optional delay
              } catch (tabMoveError) {
                console.error(`Could not move tab ${tab.id} from window ${window.id}:`, tabMoveError);
                // Continue loop to try moving other tabs
              }
            }
            // Note: This leaves the now-empty window open.
            // You could potentially add logic here to close the window if it becomes empty,
            // but checking that reliably after async moves is tricky.
            // Leaving empty windows is simpler for this example.
          }
        }
  
        // 4. Update status based on results
        if (tabsMovedCount > 0) {
          statusElement.textContent = `Successfully moved ${tabsMovedCount} tab(s).`;
          statusElement.style.color = 'green';
        } else {
          statusElement.textContent = 'No tabs found in other windows to move.';
          statusElement.style.color = 'blue'; // Indicate no action needed
        }
  
        // Optional: Close the popup automatically after a few seconds
        setTimeout(() => {
          window.close();
        }, tabsMovedCount > 0 ? 2000 : 1000); // Close faster if no tabs moved
  
      } catch (error) {
        console.error('An error occurred:', error);
        statusElement.textContent = 'An error occurred while moving tabs.';
        statusElement.style.color = 'red';
        button.disabled = false; // Re-enable button on error
      }
    });
  });