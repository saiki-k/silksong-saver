// Load backups when page loads
document.addEventListener('DOMContentLoaded', () => {
    loadBackups();
});

document.getElementById('backupForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const backupName = document.getElementById('backupName').value.trim();
    const saveSlot = document.getElementById('saveSlot').value;

    if (!backupName) {
        showResult('Please enter a backup name.', 'error');
        return;
    }

    if (!saveSlot) {
        showResult('Please select a save slot.', 'error');
        return;
    }

    try {
        const response = await fetch('/create-backup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ backupName, saveSlot })
        });

        const data = await response.json();

        if (response.ok) {
            showResult(data.message, 'success');
            document.getElementById('backupName').value = '';
            // Refresh the backup list after creating a new backup
            loadBackups();
        } else {
            showResult(data.error || 'An error occurred', 'error');
        }
    } catch (error) {
        showResult('Network error: ' + error.message, 'error');
    }
});

async function loadBackups() {
    const backupsList = document.getElementById('backupsList');
    
    try {
        backupsList.innerHTML = '<div class="loading">Loading backups...</div>';
        
        const response = await fetch('/backups');
        const data = await response.json();
        
        if (response.ok) {
            displayBackups(data.backups);
        } else {
            backupsList.innerHTML = '<div class="error">Failed to load backups</div>';
        }
    } catch (error) {
        backupsList.innerHTML = '<div class="error">Network error loading backups</div>';
    }
}

function displayBackups(backups) {
    const backupsList = document.getElementById('backupsList');
    
    if (backups.length === 0) {
        backupsList.innerHTML = '<div class="no-backups">No backups found. Create your first backup above!</div>';
        return;
    }
    
    backupsList.innerHTML = backups.map(backup => {
        const displayName = formatBackupName(backup.name);
        const formattedTimestamp = formatTimestamp(backup.timestamp);
        
        return `
            <div class="backup-card">
                <div class="backup-info">
                    <div class="backup-name">${displayName}</div>
                    <div class="backup-pills">
                        <span class="pill timestamp">${formattedTimestamp}</span>
                        <span class="pill slot">Slot ${backup.slot}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function formatBackupName(name) {
    return name
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
}

function formatTimestamp(timestamp) {
    // Convert from 2024-11-04-14-30-15 format to readable format
    const parts = timestamp.split('-');
    if (parts.length === 6) {
        const [year, month, day, hour, minute, second] = parts;
        const date = new Date(year, month - 1, day, hour, minute, second);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return timestamp;
}

function showResult(message, type) {
    const resultDiv = document.getElementById('result');
    resultDiv.textContent = message;
    resultDiv.className = `result ${type}`;
    resultDiv.style.display = 'block';

    if (type === 'success') {
        setTimeout(() => {
            resultDiv.style.display = 'none';
        }, 5000);
    }
}