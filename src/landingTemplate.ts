// Adapted version of https://github.com/Stremio/stremio-addon-sdk/blob/v1.6.2/src/landingTemplate.js
import { CustomManifest } from './types';
import { envGet } from './utils';

const STYLESHEET = `
* {
  box-sizing: border-box;
}

body,
html {
  margin: 0;
  padding: 0;
  width: 100%;
  min-height: 100vh;
}

html {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
  overflow-x: hidden;
}

html::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: url('data:image/svg+xml,<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><defs><pattern id="grid" width="100" height="100" patternUnits="userSpaceOnUse"><path d="M 100 0 L 0 0 0 100" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="1"/></pattern></defs><rect width="100" height="100" fill="url(%23grid)"/></svg>');
  opacity: 0.3;
  z-index: 0;
}

body {
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  color: white;
  padding: 2rem;
  position: relative;
  z-index: 1;
}

#addon {
  width: 100%;
  max-width: 520px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  padding: 3rem;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3),
              0 0 0 1px rgba(255, 255, 255, 0.1) inset;
  animation: fadeIn 0.6s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.logo {
  width: 100px;
  height: 100px;
  margin: 0 auto 2rem;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  transition: transform 0.3s ease;
}

.logo:hover {
  transform: scale(1.05);
}

.logo img {
  width: 80%;
  height: 80%;
  object-fit: contain;
}

h1 {
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0 0 0.5rem;
  text-align: center;
  background: linear-gradient(135deg, #fff 0%, #f0f0f0 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.5px;
}

h2 {
  font-size: 1rem;
  font-weight: 400;
  margin: 0 0 2rem;
  text-align: center;
  opacity: 0.85;
  color: rgba(255, 255, 255, 0.9);
}

h3 {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 1rem;
  color: rgba(255, 255, 255, 0.95);
}

p {
  font-size: 0.95rem;
  line-height: 1.6;
  margin: 0;
  opacity: 0.9;
}

ul {
  font-size: 0.95rem;
  margin: 0.5rem 0;
  padding-left: 1.5rem;
  list-style: none;
}

ul li {
  position: relative;
  padding-left: 1.5rem;
  margin-bottom: 0.5rem;
}

ul li::before {
  content: '▸';
  position: absolute;
  left: 0;
  color: rgba(255, 255, 255, 0.7);
  font-weight: bold;
}

a {
  color: white;
  text-decoration: none;
  transition: opacity 0.2s ease;
}

a:hover {
  opacity: 0.8;
}

a.install-link {
  display: block;
  margin-top: 2rem;
}

button {
  width: 100%;
  border: 0;
  outline: 0;
  color: white;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 1rem 2rem;
  border-radius: 12px;
  font-family: 'Inter', sans-serif;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 10px 25px rgba(102, 126, 234, 0.4);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

button::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

button:hover::before {
  opacity: 1;
}

button:hover {
  transform: translateY(-2px);
  box-shadow: 0 15px 35px rgba(102, 126, 234, 0.5);
}

button:active {
  transform: translateY(0);
}

button span {
  position: relative;
  z-index: 1;
}

.separator {
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  margin: 2rem 0;
}

.form-element {
  margin-bottom: 1.5rem;
}

.label-to-top {
  font-size: 0.9rem;
  font-weight: 500;
  margin-bottom: 0.5rem;
  color: rgba(255, 255, 255, 0.9);
}

.label-to-right {
  margin-left: 0.5rem;
  font-weight: 500;
}

input[type="text"],
input[type="number"],
input[type="password"],
select {
  width: 100%;
  padding: 0.875rem 1rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  color: white;
  font-size: 0.95rem;
  font-family: 'Inter', sans-serif;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

input[type="text"]:focus,
input[type="number"]:focus,
input[type="password"]:focus,
select:focus {
  outline: none;
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.4);
  box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.1);
}

input[type="text"]::placeholder,
input[type="number"]::placeholder,
input[type="password"]::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

select {
  cursor: pointer;
}

select option {
  background: #667eea;
  color: white;
}

input[type="checkbox"] {
  width: 20px;
  height: 20px;
  cursor: pointer;
  accent-color: #667eea;
}

.contact {
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  text-align: center;
}

.contact p {
  font-size: 0.85rem;
  margin-bottom: 0.5rem;
  opacity: 0.7;
}

.contact a {
  font-size: 0.9rem;
  opacity: 0.8;
}

.description {
  text-align: center;
  margin-bottom: 2rem;
  opacity: 0.85;
  line-height: 1.6;
}

.github-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  transition: all 0.3s ease;
}

.github-link:hover {
  background: rgba(255, 255, 255, 0.15);
  transform: translateY(-1px);
}

@media (max-width: 640px) {
  #addon {
    padding: 2rem 1.5rem;
  }

  h1 {
    font-size: 2rem;
  }

  h2 {
    font-size: 0.9rem;
  }
}
`;

export function landingTemplate(manifest: CustomManifest) {
  const logo = manifest.logo || 'https://dl.strem.io/addon-logo.png';
  const contactHTML = manifest.contactEmail
    ? `<div class="contact">
      <p>Contact ${manifest.name} creator</p>
      <a href="mailto:${manifest.contactEmail}">${manifest.contactEmail}</a>
    </div>`
    : '';

  const stylizedTypes = manifest.types
    .map(types => types.charAt(0).toUpperCase() + types.slice(1) + (types !== 'series' ? 's' : ''));

  let formHTML = '';
  let script = '';

  if ((manifest.config || []).length) {
    let options = '';
    manifest.config.forEach((elem) => {
      const key = elem.key;
      if (['text', 'number', 'password'].includes(elem.type)) {
        const isRequired = elem.required ? ' required' : '';
        const defaultHTML = elem.default ? ` value="${elem.default}"` : '';
        const inputType = elem.type;
        options += `
        <div class="form-element">
          <div class="label-to-top">${elem.title}</div>
          <input type="${inputType}" id="${key}" name="${key}"${defaultHTML}${isRequired}/>
        </div>
        `;
      } else if (elem.type === 'checkbox') {
        const isChecked = elem.default === 'checked' ? ' checked' : '';
        options += `
        <div class="form-element">
          <label for="${key}">
            <input type="checkbox" id="${key}" name="${key}"${isChecked}> <span class="label-to-right">${elem.title}</span>
          </label>
        </div>
        `;
      } else if (elem.type === 'select') {
        const defaultValue = elem.default || (elem.options || [])[0];
        options += `<div class="form-element">
        <div class="label-to-top">${elem.title}</div>
        <select id="${key}" name="${key}">
        `;
        const selections = elem.options || [];
        selections.forEach((el) => {
          const isSelected = el === defaultValue ? ' selected' : '';
          options += `<option value="${el}"${isSelected}>${el}</option>`;
        });
        options += `</select>
               </div>
               `;
      }
    });
    if (options.length) {
      formHTML = `
      <form id="mainForm">
        ${options}
      </form>

      <div class="separator"></div>
      `;
      script += `
      installLink.onclick = () => {
        return mainForm.reportValidity()
      }
      const updateLink = () => {
        const config = Object.fromEntries(new FormData(mainForm))
        installLink.href = 'stremio://' + window.location.host + '/' + encodeURIComponent(JSON.stringify(config)) + '/manifest.json'
      }
      mainForm.onchange = updateLink
      `;
    }
  }

  return `
  <!DOCTYPE html>
  <html lang="en">

  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${manifest.name} - Stremio Addon</title>
    <style>${STYLESHEET}</style>
    <link rel="shortcut icon" href="${logo}" type="image/x-icon">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  </head>

  <body>
    <div id="addon">
      <div class="logo">
        <img src="${logo}" alt="${manifest.name} logo">
      </div>
      <h1>${manifest.name}</h1>
      <h2>v${manifest.version || '0.0.0'}</h2>
      <div class="description">${manifest.description.replace(/\n/g, '<br>') || ''}</div>

      <div class="separator"></div>

      <p style="text-align: center;">
        <a href="https://github.com/fluxstream/fluxstream" target="_blank" class="github-link">
          <span>View on GitHub</span>
        </a>
      </p>

      ${envGet('CONFIGURATION_DESCRIPTION') ? `
      <div class="separator"></div>
      <div style="text-align: center;">
        ${envGet('CONFIGURATION_DESCRIPTION')}
      </div>
      ` : ''}

      <div class="separator"></div>

      <h3>Available content</h3>
      <ul>
      ${stylizedTypes.map(t => `<li>${t}</li>`).join('')}
      </ul>

      <div class="separator"></div>

      ${formHTML}

      <a id="installLink" class="install-link" href="#">
        <button name="Install"><span>INSTALL ADDON</span></button>
      </a>
      ${contactHTML}
    </div>
    <script>
      ${script}

      if (typeof updateLink === 'function')
        updateLink()
      else
        installLink.href = 'stremio://' + window.location.host + '/manifest.json'
    </script>
  </body>

  </html>`;
}
