# Phase 3 Implementation - Usage Examples

## 🎯 Quick Integration Guide

This guide shows how to use the new Phase 3 components in your pages.

---

## 1. Confirmation Dialog

### Basic Usage
```jsx
import { useState } from 'react';
import ConfirmDialog from '../components/ui/ConfirmDialog';

function MyComponent() {
  const [showConfirm, setShowConfirm] = useState(false);
  
  const handleDelete = () => {
    // Your delete logic here
    console.log('Deleted!');
  };
  
  return (
    <>
      <button onClick={() => setShowConfirm(true)}>
        Delete Service
      </button>
      
      <ConfirmDialog
        open={showConfirm}
        title="Delete Service?"
        message="This will permanently delete the service. This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDelete}
        onCancel={() => setShowConfirm(false)}
        variant="danger"
      />
    </>
  );
}
```

### Variants
- `danger` - Red (for deletions)
- `warning` - Yellow (for warnings)
- `info` - Blue (for information)
- `success` - Green (for confirmations)

---

## 2. Tooltip

### Basic Usage
```jsx
import Tooltip from '../components/ui/Tooltip';
import { RotateCw, Trash, Edit } from 'lucide-react';

function ServiceActions() {
  return (
    <div style={{ display: 'flex', gap: '0.5rem' }}>
      <Tooltip content="Restart service">
        <button onClick={handleRestart}>
          <RotateCw size={18} />
        </button>
      </Tooltip>
      
      <Tooltip content="Edit service" position="top">
        <button onClick={handleEdit}>
          <Edit size={18} />
        </button>
      </Tooltip>
      
      <Tooltip content="Delete service" position="bottom">
        <button onClick={handleDelete}>
          <Trash size={18} />
        </button>
      </Tooltip>
    </div>
  );
}
```

### Positions
- `top` (default)
- `bottom`
- `left`
- `right`

---

## 3. Progress Bar

### Basic Usage
```jsx
import ProgressBar from '../components/ui/ProgressBar';

function UploadFile() {
  const [progress, setProgress] = useState(0);
  
  return (
    <ProgressBar
      value={progress}
      label="Uploading file..."
      variant="primary"
      size="md"
    />
  );
}
```

### Indeterminate (Loading)
```jsx
<ProgressBar
  indeterminate
  label="Processing..."
  variant="primary"
/>
```

### Variants
- `primary` - Accent color
- `success` - Green
- `warning` - Yellow
- `danger` - Red

---

## 4. Keyboard Shortcuts

Already integrated! Available shortcuts:

- `Ctrl+/` - Show shortcuts help
- `1-5` - Navigate to pages
- `R` - Refresh
- `Esc` - Close dialogs

### Show Shortcuts Help
```jsx
import KeyboardShortcutsHelp from '../components/ui/KeyboardShortcutsHelp';
import { useState } from 'react';

function App() {
  const [showHelp, setShowHelp] = useState(false);
  
  return (
    <KeyboardShortcutsHelp
      open={showHelp}
      onClose={() => setShowHelp(false)}
    />
  );
}
```

---

## 5. Responsive Design

Automatically applied! No code needed.

### Hide Elements on Mobile
```jsx
<div className="hide-mobile">
  This won't show on mobile
</div>
```

### Touch-Friendly Buttons
All buttons automatically have 44px minimum tap targets on mobile.

---

## 📱 Complete Example: Services Page Integration

```jsx
import React, { useState } from 'react';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import Tooltip from '../components/ui/Tooltip';
import ProgressBar from '../components/ui/ProgressBar';
import { Trash, RotateCw, Play, Square } from 'lucide-react';

function ServicesPage() {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [isRestarting, setIsRestarting] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleDelete = (service) => {
    setSelectedService(service);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    // Delete logic
    await deleteService(selectedService.id);
    setShowDeleteConfirm(false);
  };

  const handleRestart = async (service) => {
    setIsRestarting(true);
    setProgress(0);
    
    // Simulate progress
    for (let i = 0; i <= 100; i += 10) {
      setProgress(i);
      await new Promise(r => setTimeout(r, 200));
    }
    
    setIsRestarting(false);
  };

  return (
    <div>
      <h1>Services</h1>
      
      {/* Progress for restart */}
      {isRestarting && (
        <ProgressBar
          value={progress}
          label="Restarting service..."
          variant="primary"
        />
      )}
      
      {/* Service list */}
      <div className="services-grid">
        {services.map(service => (
          <div key={service.id} className="service-card">
            <h3>{service.name}</h3>
            <p>{service.status}</p>
            
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Tooltip content="Start service">
                <button>
                  <Play size={18} />
                </button>
              </Tooltip>
              
              <Tooltip content="Stop service">
                <button>
                  <Square size={18} />
                </button>
              </Tooltip>
              
              <Tooltip content="Restart service">
                <button onClick={() => handleRestart(service)}>
                  <RotateCw size={18} />
                </button>
              </Tooltip>
              
              <Tooltip content="Delete service">
                <button onClick={() => handleDelete(service)}>
                  <Trash size={18} />
                </button>
              </Tooltip>
            </div>
          </div>
        ))}
      </div>
      
      {/* Delete confirmation */}
      <ConfirmDialog
        open={showDeleteConfirm}
        title="Delete Service?"
        message={`Are you sure you want to delete "${selectedService?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
        variant="danger"
      />
    </div>
  );
}
```

---

## 🎨 Customization

### Custom Tooltip Delay
```jsx
<Tooltip content="Helpful text" delay={500}>
  <button>Hover me</button>
</Tooltip>
```

### Custom Progress Colors
```jsx
<ProgressBar
  value={75}
  variant="success"
  size="lg"
/>
```

### Confirmation with Custom Colors
```jsx
<ConfirmDialog
  variant="warning"  // Yellow theme
  title="Warning!"
  message="Are you sure?"
  ...
/>
```

---

## ✅ Best Practices

1. **Tooltips**: Use for icon-only buttons
2. **Confirmations**: Always confirm destructive actions
3. **Progress**: Show for operations > 2 seconds
4. **Keyboard**: Document custom shortcuts
5. **Mobile**: Test touch interactions

---

**All components are fully accessible and responsive!** 🎉
