(function() {
  let blacklistCompanies = [
    { name: "Global Data Broker Inc.", reports: 1240 },
    { name: "EuroCall Center B.V.", reports: 942 },
    { name: "Apex Marketing Group", reports: 811 },
    { name: "LeadGen Logistics", reports: 650 },
    { name: "DirectConnect Media", reports: 523 },
    { name: "TeleSales Solutions", reports: 412 },
    { name: "ConsumerData Ltd.", reports: 389 },
    { name: "ValidLeads Network", reports: 275 },
    { name: "SpamWave Agency", reports: 198 },
    { name: "TargetedLists Corp.", reports: 143 }
  ];

  const searchBtn = document.getElementById('searchBtn');
  const companySearch = document.getElementById('companySearch');
  const searchResult = document.getElementById('searchResult');

  const SUPABASE_URL = "https://qoffylaknlkadkryyfqq.supabase.co";
  const SUPABASE_ANON_KEY = "sb_publishable_wKjWbotyB74WxGk1NVBm0w_I4Fox1Fn";
  window.supabaseClient = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

  async function refreshGlobalShameList() {
    if (!supabaseClient) return;
    const { data, error } = await supabaseClient.from('shame_list').select('*').order('reports', { ascending: false }).limit(10);
    if (!error && data && data.length > 0) {
      blacklistCompanies = data;
      updateShameList();
    }
  }

  function autoCreateEmail(name) {
    if (!name) return 'privacy@spambank.com';
    let cleanName = name.toLowerCase().trim();
    let domain = "com";

    if (cleanName.endsWith('.nl')) {
      domain = "nl";
      cleanName = cleanName.replace('.nl', '');
    } else if (cleanName.endsWith('.com')) {
      domain = "com";
      cleanName = cleanName.replace('.com', '');
    } else if (cleanName.endsWith('.org')) {
      domain = "org";
      cleanName = cleanName.replace('.org', '');
    }

    cleanName = cleanName.replace(/[^a-z0-9]/g, '').replace(/(inc|bv|ltd)$/, '');
    return `privacy@${cleanName || 'spambank'}.${domain}`;
  }

  window.openDirectReportModal = function(prefilledName = "") {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-box">
            <h2>🔴 Report Unsolicited Spam</h2>
            <p class="modal-intro">Submit verified evidence to add this entity to the global Wall of Shame.</p>
            <div class="form-group">
                <label>Company / Instance Name</label>
                <input type="text" id="reportCompanyName" value="${prefilledName}" placeholder="e.g. Shady Leads Corp">
            </div>
            <div class="form-group">
                <label>Spam Type</label>
                <select id="reportSpamType">
                    <option value="email">Unsolicited Email (Spam)</option>
                    <option value="call">Cold Calling / Callcenter</option>
                    <option value="sms">Unwanted SMS / WhatsApp</option>
                    <option value="selling">Verified Data Selling/Trading</option>
                </select>
            </div>
            <div class="form-group">
                <label>Your Email (Kept Strictly Confidential)</label>
                <input type="email" id="reportUserEmail" placeholder="yourname@example.com">
            </div>
            <div class="form-group">
                <label>Upload Evidence (Screenshot of email or call log)</label>
                <input type="file" id="realFileInput" accept="image/*" style="display: none;">
                <div class="fake-upload-btn" id="triggerUploadBtn">Select Evidence File</div>
            </div>
            <div class="modal-actions" style="margin-top: 1.5rem;">
                <button class="btn-confirm-send" id="btnSubmitSpam">File Official Report</button>
                <button class="btn-close-modal" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    const realFileInput = document.getElementById('realFileInput');
    const triggerUploadBtn = document.getElementById('triggerUploadBtn');

    if (triggerUploadBtn && realFileInput) {
      triggerUploadBtn.addEventListener('click', () => realFileInput.click());
      realFileInput.addEventListener('change', () => {
        if (realFileInput.files && realFileInput.files.length > 0) {
          triggerUploadBtn.innerHTML = "📁 " + realFileInput.files[0].name;
          triggerUploadBtn.style.borderColor = "#10b981";
          triggerUploadBtn.style.color = "#10b981";
        }
      });
    }

    document.getElementById('btnSubmitSpam').addEventListener('click', async () => {
      const targetName = document.getElementById('reportCompanyName').value.trim();
      if (targetName === "") {
        alert("Please fill in the company name.");
        return;
      }
      const btn = document.getElementById('btnSubmitSpam');
      btn.innerHTML = `Logging to Cloud...`;
      btn.disabled = true;
      if (supabaseClient) {
        const { data: existing } = await supabaseClient.from('shame_list').select('*').ilike('name', targetName).maybeSingle();
        if (existing) {
          await supabaseClient.from('shame_list').update({ reports: existing.reports + 1 }).eq('id', existing.id);
        } else {
          const autoMail = autoCreateEmail(targetName);
          await supabaseClient.from('shame_list').insert([{ name: targetName, reports: 1, email: autoMail }]);
        }
        await refreshGlobalShameList();
      }
      const modalBox = btn.closest('.modal-box');
      modalBox.innerHTML = `
        <h2>🛡️ Report Logged Worldwide</h2>
        <p style="margin: 1.5rem 0; color: #e5e7eb;">Thank you. This report has been synced permanently with our global database servers.</p>
        <button class="btn-action-report" onclick="this.closest('.modal-overlay').remove()">Close</button>
      `;
    });
  };

  async function performSearch() {
    const liveInput = document.getElementById('companySearch') || document.querySelector('.search-box input');
    const liveResult = document.getElementById('searchResult') || document.querySelector('.result-box');
    if (!liveInput || !liveResult) return;

    const query = liveInput.value.trim();
    if (query === "") {
      liveResult.classList.add('hidden');
      return;
    }
    liveResult.classList.remove('hidden');
    liveResult.innerHTML = `<div class="result-card"><p>🔍 Searching global cloud...</p></div>`;
    let foundCompany = null;
    if (supabaseClient) {
      const { data } = await supabaseClient.from('shame_list').select('*').ilike('name', query).maybeSingle();
      foundCompany = data;
    }
    if (foundCompany) {
      liveResult.innerHTML = `
        <div class="result-card danger">
          <h3>⚠️ Match Found</h3>
          <p><strong>${foundCompany.name}</strong> is on this list because they do not follow privacy guidelines.</p>
          <button class="btn-action-claim" onclick="sendOptOut('${foundCompany.name}')">Send Official Opt-Out Request</button>
        </div>
      `;
    } else {
      liveResult.innerHTML = `
        <div class="result-card success">
          <h3>✅ Clear</h3>
          <p><strong>${query}</strong> is not in our database (yet).</p>
          <button class="btn-action-report" onclick="window.openDirectReportModal('${query.replace(/'/g, "\\'")}')">Report This Company</button>
        </div>
      `;
    }
  }

  setTimeout(refreshGlobalShameList, 500);

  function updateShameList() {
    blacklistCompanies.sort((a, b) => b.reports - a.reports);
    const listContainer = document.querySelector('.shame-list');
    if (listContainer) {
      listContainer.innerHTML = "";
      blacklistCompanies.slice(0, 10).forEach(company => {
        const li = document.createElement('li');
        li.innerHTML = `<span class="company-name">${company.name}</span> <span class="badge red">${company.reports.toLocaleString()} reports</span>`;
        listContainer.appendChild(li);
      });
    }
  }

  document.querySelectorAll('header nav a').forEach(link => {
    const text = link.textContent ? link.textContent.trim().toLowerCase() : '';

    link.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();

      if (text === 'about') {
        openDirectAboutModal();
      } else if (text === 'company audit') {
        openDirectAuditModal();
      } else if (text === 'report spam') {
        openDirectReportModal();
      }
    });
  });

  document.addEventListener('click', function(e) {
    if (e.target && (e.target.id === 'searchBtn' || e.target.closest('#searchBtn') || e.target.closest('.search-box button'))) {
      e.preventDefault();
      performSearch();
    }
  });

  const searchInputField = document.querySelector('.search-box input');
  if (searchInputField) {
    searchInputField.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        performSearch();
      }
    });
  }

  function renderSponsors() {
    const grid = document.getElementById('sponsorsGrid');
    if (!grid) return;

    let htmlContent = "";

    if (window.officialSponsors && window.officialSponsors.length > 0) {
      window.officialSponsors.forEach(sponsor => {
        htmlContent += `
          <div class="sponsor-card gold-badge">
            <span class="badge-icon">${sponsor.icon}</span>
            <div class="sponsor-info">
              <span class="sponsor-name">${sponsor.name}</span>
              <span class="sponsor-status">Verified Sponsor</span>
            </div>
          </div>
        `;
      });
    }

    htmlContent += `
      <div class="sponsor-card gold-badge" style="border-style: dashed; background: transparent; justify-content: center; width: 100%; max-width: 500px; margin: 0 auto;">
        <div class="sponsor-info" style="text-align: center;">
          <span class="sponsor-name" style="color: #d97706; font-size: 0.95rem; display: block;">🏆 Become an Official Privacy Sponsor</span>
          <span class="sponsor-status" style="color: #9ca3af; margin-top: 0.25rem; display: block; line-height: 1.4; font-size: 0.85rem;">This space is strictly reserved for legitimate privacy-first organizations, cybersecurity firms, and open-source networks (e.g., Brave, NordVPN) that actively support digital freedom. To verify your status and award the official sponsor badge, make a support donation of 0.005 BTC and include your organization's memo/note. Malafide data brokers or spam organizations are strictly banned from verification.</span>
        </div>
      </div>
    `;

    grid.innerHTML = htmlContent;
  }

  function addNewSponsor(companyName, companyIcon = "🏢") {
    if (window.officialSponsors) {
      window.officialSponsors.push({ name: companyName, icon: companyIcon });
      renderSponsors();
    }
  }

  document.addEventListener('DOMContentLoaded', function() {
    setTimeout(renderSponsors, 500);
  });

  window.addEventListener('load', function() {
    setTimeout(renderSponsors, 1500);
  });

  function openDirectAboutModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-box">
            <h2>🎯 Our Mission Statement</h2>
            <p class="modal-intro">The foundational pillars of the Beta Application global initiative:</p>
            <div class="letter-preview">
                <p><strong>To:</strong> Global Consumers & Digital Citizens</p>
                <br>
                <p>Every single day, trillions of unsolicited spam messages and cold calls clutter communication networks worldwide. Beta Application was founded with a singular, rebellious mission: to turn the tables on data brokers and illicit callcenters.</p>
                <br>
                <p>By exposing non-compliant entities on our global Wall of Shame and empowering citizens with one-click automated Opt-Out requests, we make spamming too expensive, legally risky, and reputationally damaging to sustain.</p>
                <br>
                <p>Your data belongs to you—it is time to lock the envelope.</p>
            </div>
            <div class="modal-actions" style="justify-content: flex-end;">
                <button class="btn-action-report" onclick="this.closest('.modal-overlay').remove()">Close Window</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
  }

  function openDirectAuditModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-box" style="max-width: 650px;">
            <h2>⚖️ Company Audit Procedure</h2>
            <p class="modal-intro">The transparent legal compliance framework for listed companies:</p>
            <div class="letter-preview" style="max-height: 200px;">
                <p><strong>To:</strong> Legal Departments & Compliance Officers</p>
                <br>
                <p>We are strictly against digital extortion. Beta Application operates with absolute legal integrity. If your company has been listed on our Wall of Shame, we provide a transparent, objective compliance audit to clean your record entirely free of charge.</p>
                <br>
                <p>To be removed from the database, your legal department must supply cryptographic or logged proof of explicit user consent (Opt-In), verify the immediate purging of the claimant's records (Right to be Forgotten), and submit to our automated data-handling guidelines.</p>
                <br>
                <p>Compliance is the only way out.</p>
            </div>
            <div style="background-color: rgba(217, 119, 6, 0.05); border: 1px solid rgba(217, 119, 6, 0.2); padding: 1.25rem; border-radius: 8px; margin: 1.5rem 0; text-align: left;">
                <p style="color: #d97706; font-weight: 700; font-size: 0.95rem; margin-bottom: 0.75rem;">🏢 Submit Compliance Documents</p>
                <div class="form-group" style="margin-bottom: 1rem;">
                    <label style="font-size: 0.8rem; color: #cbd5e1;">Official Company Email</label>
                    <input type="email" id="auditCompanyEmail" placeholder="legal@yourcompany.com" style="width: 100%; background-color: #0b111e; border: 1px solid #1f2a3c; padding: 0.5rem; border-radius: 6px; color: #ffffff; font-family: inherit;">
                </div>
                <label style="display: block; font-size: 0.8rem; font-weight: 600; margin-bottom: 0.5rem; color: #cbd5e1;">Upload Cryptographic Logs / PDF Audit Report:</label>
                <input type="file" id="realAuditFileInput" accept=".pdf,.txt,.log" style="display: none;">
                <div class="fake-upload-btn" id="triggerAuditUploadBtn" style="border-color: #d97706; color: #d97706; background-color: rgba(217, 119, 6, 0.02);">Select Compliance File (.pdf, .log, .txt)</div>
            </div>
            <div class="modal-actions">
                <button class="btn-confirm-send" id="btnSubmitAudit" style="background-color: #d97706; flex: 2;">Submit Audit Application</button>
                <button class="btn-close-modal" onclick="this.closest('.modal-overlay').remove()" style="flex: 1;">Cancel</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    const realAuditFileInput = document.getElementById('realAuditFileInput');
    const triggerAuditUploadBtn = document.getElementById('triggerAuditUploadBtn');

    if (triggerAuditUploadBtn && realAuditFileInput) {
      triggerAuditUploadBtn.addEventListener('click', () => realAuditFileInput.click());
      realAuditFileInput.addEventListener('change', () => {
        if (realAuditFileInput.files && realAuditFileInput.files.length > 0) {
          triggerAuditUploadBtn.innerHTML = "📁 " + realAuditFileInput.files[0].name;
          triggerAuditUploadBtn.style.borderColor = "#10b981";
          triggerAuditUploadBtn.style.color = "#10b981";
        } else {
          triggerAuditUploadBtn.innerHTML = "Select Compliance File (.pdf, .log, .txt)";
          triggerAuditUploadBtn.style.borderColor = "#d97706";
          triggerAuditUploadBtn.style.color = "#d97706";
        }
      });
    }

    document.getElementById('btnSubmitAudit').addEventListener('click', () => {
      const companyEmail = document.getElementById('auditCompanyEmail').value.trim();
      if (companyEmail === "") {
        alert("Please fill in your official corporate email address.");
        return;
      }
      const btn = document.getElementById('btnSubmitAudit');
      btn.innerHTML = `Verifying Documents...`;
      btn.disabled = true;

      setTimeout(() => {
        const modalBox = btn.closest('.modal-box');
        modalBox.innerHTML = `
                <h2>⏳ Audit Under Review</h2>
                <p style="margin: 1.5rem 0; color: #e5e7eb;">Thank you. Your compliance files and cryptographic data logs have been securely submitted to our verification server. Our legal team will review the evidence within 7 business days.</p>
                <button class="btn-action-report" onclick="this.closest('.modal-overlay').remove()">Return to Index</button>
            `;
      }, 2000);
    });
  }

  function openDirectReportModal(prefilledName = "") {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-box">
            <h2>🔴 Report Unsolicited Spam</h2>
            <p class="modal-intro">Submit verified evidence to add this entity to the global Wall of Shame.</p>
            <div class="form-group">
                <label>Company / Instance Name</label>
                <input type="text" id="reportCompanyName" value="${prefilledName}" placeholder="e.g. Shady Leads Corp">
            </div>
            <div class="form-group">
                <label>Spam Type</label>
                <select id="reportSpamType">
                    <option value="email">Unsolicited Email (Spam)</option>
                    <option value="call">Cold Calling / Callcenter</option>
                    <option value="sms">Unwanted SMS / WhatsApp</option>
                    <option value="selling">Verified Data Selling/Trading</option>
                </select>
            </div>
            <div class="form-group">
                <label>Your Email (Kept Strictly Confidential)</label>
                <input type="email" id="reportUserEmail" placeholder="yourname@example.com">
            </div>
            <div class="form-group">
                <label>Upload Evidence (Screenshot of email or call log)</label>
                <input type="file" id="realFileInput" accept="image/*" style="display: none;">
                <div class="fake-upload-btn" id="triggerUploadBtn">Select Evidence File</div>
            </div>
            <div class="modal-actions" style="margin-top: 1.5rem;">
                <button class="btn-confirm-send" id="btnSubmitSpam">File Official Report</button>
                <button class="btn-close-modal" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    const realFileInput = document.getElementById('realFileInput');
    const triggerUploadBtn = document.getElementById('triggerUploadBtn');

    if (triggerUploadBtn && realFileInput) {
      triggerUploadBtn.addEventListener('click', () => realFileInput.click());
      realFileInput.addEventListener('change', () => {
        if (realFileInput.files && realFileInput.files.length > 0) {
          triggerUploadBtn.innerHTML = "📁 " + realFileInput.files[0].name;
          triggerUploadBtn.style.borderColor = "#10b981";
          triggerUploadBtn.style.color = "#10b981";
        } else {
          triggerUploadBtn.innerHTML = "Select Evidence File";
          triggerUploadBtn.style.borderColor = "";
          triggerUploadBtn.style.color = "";
        }
      });
    }

    document.getElementById('btnSubmitSpam').addEventListener('click', () => {
      const targetName = document.getElementById('reportCompanyName').value.trim();
      if (targetName === "") {
        alert("Please fill in the company name.");
        return;
      }
      const btn = document.getElementById('btnSubmitSpam');
      btn.innerHTML = `Processing Report...`;
      btn.disabled = true;

      setTimeout(() => {
        const existing = blacklistCompanies.find(c => c.name.toLowerCase() === targetName.toLowerCase());
        if (existing) {
          existing.reports += 1;
        } else {
          blacklistCompanies.push({ name: targetName, reports: 1 });
        }
        updateShameList();

        const modalBox = btn.closest('.modal-box');
        modalBox.innerHTML = `
                <h2>🛡️ Report Logged Successfully</h2>
                <p style="margin: 1.5rem 0; color: #e5e7eb;">Thank you. The report has been added to our verification queue. <strong>${targetName}</strong>'s rank on the Wall of Shame has been updated dynamically.</p>
                <button class="btn-action-report" onclick="this.closest('.modal-overlay').remove()">Close</button>
            `;
      }, 1500);
    });
  }

  document.querySelectorAll('header nav a').forEach(link => {
    const text = link.textContent ? link.textContent.trim().toLowerCase() : '';

    link.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();

      if (text === 'about') {
        openDirectAboutModal();
      } else if (text === 'company audit') {
        openDirectAuditModal();
      } else if (text === 'report spam') {
        openDirectReportModal();
      }
    });
  });

  document.addEventListener('click', function(e) {
    if (e.target && (e.target.id === 'searchBtn' || e.target.closest('#searchBtn') || e.target.closest('.search-box button'))) {
      e.preventDefault();
      performSearch();
    }
  });

  const searchInputField = document.querySelector('.search-box input');
  if (searchInputField) {
    searchInputField.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        performSearch();
      }
    });
  }

  function renderSponsors() {
    const grid = document.getElementById('sponsorsGrid');
    if (!grid) return;

    let htmlContent = "";

    if (window.officialSponsors && window.officialSponsors.length > 0) {
      window.officialSponsors.forEach(sponsor => {
        htmlContent += `
          <div class="sponsor-card gold-badge">
            <span class="badge-icon">${sponsor.icon}</span>
            <div class="sponsor-info">
              <span class="sponsor-name">${sponsor.name}</span>
              <span class="sponsor-status">Verified Sponsor</span>
            </div>
          </div>
        `;
      });
    }

    htmlContent += `
      <div class="sponsor-card gold-badge" style="border-style: dashed; background: transparent; justify-content: center; width: 100%; max-width: 500px; margin: 0 auto;">
        <div class="sponsor-info" style="text-align: center;">
          <span class="sponsor-name" style="color: #d97706; font-size: 0.95rem; display: block;">🏆 Become an Official Privacy Sponsor</span>
          <span class="sponsor-status" style="color: #9ca3af; margin-top: 0.25rem; display: block; line-height: 1.4; font-size: 0.85rem;">This space is strictly reserved for legitimate privacy-first organizations, cybersecurity firms, and open-source networks (e.g., Brave, NordVPN) that actively support digital freedom. To verify your status and award the official sponsor badge, make a support donation of 0.005 BTC and include your organization's memo/note. Malafide data brokers or spam organizations are strictly banned from verification.</span>
        </div>
      </div>
    `;

    grid.innerHTML = htmlContent;
  }

  function addNewSponsor(companyName, companyIcon = "🏢") {
    if (window.officialSponsors) {
      window.officialSponsors.push({ name: companyName, icon: companyIcon });
      renderSponsors();
    }
  }

  document.addEventListener('DOMContentLoaded', function() {
    setTimeout(renderSponsors, 500);
  });

  window.addEventListener('load', function() {
    setTimeout(renderSponsors, 1500);
  });

  function openDirectAboutModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-box">
            <h2>🎯 Our Mission Statement</h2>
            <p class="modal-intro">The foundational pillars of the Beta Application global initiative:</p>
            <div class="letter-preview">
                <p><strong>To:</strong> Global Consumers & Digital Citizens</p>
                <br>
                <p>Every single day, trillions of unsolicited spam messages and cold calls clutter communication networks worldwide. Beta Application was founded with a singular, rebellious mission: to turn the tables on data brokers and illicit callcenters.</p>
                <br>
                <p>By exposing non-compliant entities on our global Wall of Shame and empowering citizens with one-click automated Opt-Out requests, we make spamming too expensive, legally risky, and reputationally damaging to sustain.</p>
                <br>
                <p>Your data belongs to you—it is time to lock the envelope.</p>
            </div>
            <div class="modal-actions" style="justify-content: flex-end;">
                <button class="btn-action-report" onclick="this.closest('.modal-overlay').remove()">Close Window</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
  }

  function openDirectAuditModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-box" style="max-width: 650px;">
            <h2>⚖️ Company Audit Procedure</h2>
            <p class="modal-intro">The transparent legal compliance framework for listed companies:</p>
            <div class="letter-preview" style="max-height: 200px;">
                <p><strong>To:</strong> Legal Departments & Compliance Officers</p>
                <br>
                <p>We are strictly against digital extortion. Beta Application operates with absolute legal integrity. If your company has been listed on our Wall of Shame, we provide a transparent, objective compliance audit to clean your record entirely free of charge.</p>
                <br>
                <p>To be removed from the database, your legal department must supply cryptographic or logged proof of explicit user consent (Opt-In), verify the immediate purging of the claimant's records (Right to be Forgotten), and submit to our automated data-handling guidelines.</p>
                <br>
                <p>Compliance is the only way out.</p>
            </div>
            <div style="background-color: rgba(217, 119, 6, 0.05); border: 1px solid rgba(217, 119, 6, 0.2); padding: 1.25rem; border-radius: 8px; margin: 1.5rem 0; text-align: left;">
                <p style="color: #d97706; font-weight: 700; font-size: 0.95rem; margin-bottom: 0.75rem;">🏢 Submit Compliance Documents</p>
                <div class="form-group" style="margin-bottom: 1rem;">
                    <label style="font-size: 0.8rem; color: #cbd5e1;">Official Company Email</label>
                    <input type="email" id="auditCompanyEmail" placeholder="legal@yourcompany.com" style="width: 100%; background-color: #0b111e; border: 1px solid #1f2a3c; padding: 0.5rem; border-radius: 6px; color: #ffffff; font-family: inherit;">
                </div>
                <label style="display: block; font-size: 0.8rem; font-weight: 600; margin-bottom: 0.5rem; color: #cbd5e1;">Upload Cryptographic Logs / PDF Audit Report:</label>
                <input type="file" id="realAuditFileInput" accept=".pdf,.txt,.log" style="display: none;">
                <div class="fake-upload-btn" id="triggerAuditUploadBtn" style="border-color: #d97706; color: #d97706; background-color: rgba(217, 119, 6, 0.02);">Select Compliance File (.pdf, .log, .txt)</div>
            </div>
            <div class="modal-actions">
                <button class="btn-confirm-send" id="btnSubmitAudit" style="background-color: #d97706; flex: 2;">Submit Audit Application</button>
                <button class="btn-close-modal" onclick="this.closest('.modal-overlay').remove()" style="flex: 1;">Cancel</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    const realAuditFileInput = document.getElementById('realAuditFileInput');
    const triggerAuditUploadBtn = document.getElementById('triggerAuditUploadBtn');

    if (triggerAuditUploadBtn && realAuditFileInput) {
      triggerAuditUploadBtn.addEventListener('click', () => realAuditFileInput.click());
      realAuditFileInput.addEventListener('change', () => {
        if (realAuditFileInput.files && realAuditFileInput.files.length > 0) {
          triggerAuditUploadBtn.innerHTML = "📁 " + realAuditFileInput.files[0].name;
          triggerAuditUploadBtn.style.borderColor = "#10b981";
          triggerAuditUploadBtn.style.color = "#10b981";
        } else {
          triggerAuditUploadBtn.innerHTML = "Select Compliance File (.pdf, .log, .txt)";
          triggerAuditUploadBtn.style.borderColor = "#d97706";
          triggerAuditUploadBtn.style.color = "#d97706";
        }
      });
    }

    document.getElementById('btnSubmitAudit').addEventListener('click', () => {
      const companyEmail = document.getElementById('auditCompanyEmail').value.trim();
      if (companyEmail === "") {
        alert("Please fill in your official corporate email address.");
        return;
      }
      const btn = document.getElementById('btnSubmitAudit');
      btn.innerHTML = `Verifying Documents...`;
      btn.disabled = true;

      setTimeout(() => {
        const modalBox = btn.closest('.modal-box');
        modalBox.innerHTML = `
                <h2>⏳ Audit Under Review</h2>
                <p style="margin: 1.5rem 0; color: #e5e7eb;">Thank you. Your compliance files and cryptographic data logs have been securely submitted to our verification server. Our legal team will review the evidence within 7 business days.</p>
                <button class="btn-action-report" onclick="this.closest('.modal-overlay').remove()">Return to Index</button>
            `;
      }, 2000);
    });
  }

  function openDirectReportModal(prefilledName = "") {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-box">
            <h2>🔴 Report Unsolicited Spam</h2>
            <p class="modal-intro">Submit verified evidence to add this entity to the global Wall of Shame.</p>
            <div class="form-group">
                <label>Company / Instance Name</label>
                <input type="text" id="reportCompanyName" value="${prefilledName}" placeholder="e.g. Shady Leads Corp">
            </div>
            <div class="form-group">
                <label>Spam Type</label>
                <select id="reportSpamType">
                    <option value="email">Unsolicited Email (Spam)</option>
                    <option value="call">Cold Calling / Callcenter</option>
                    <option value="sms">Unwanted SMS / WhatsApp</option>
                    <option value="selling">Verified Data Selling/Trading</option>
                </select>
            </div>
            <div class="form-group">
                <label>Your Email (Kept Strictly Confidential)</label>
                <input type="email" id="reportUserEmail" placeholder="yourname@example.com">
            </div>
            <div class="form-group">
                <label>Upload Evidence (Screenshot of email or call log)</label>
                <input type="file" id="realFileInput" accept="image/*" style="display: none;">
                <div class="fake-upload-btn" id="triggerUploadBtn">Select Evidence File</div>
            </div>
            <div class="modal-actions" style="margin-top: 1.5rem;">
                <button class="btn-confirm-send" id="btnSubmitSpam">File Official Report</button>
                <button class="btn-close-modal" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    const realFileInput = document.getElementById('realFileInput');
    const triggerUploadBtn = document.getElementById('triggerUploadBtn');

    if (triggerUploadBtn && realFileInput) {
      triggerUploadBtn.addEventListener('click', () => realFileInput.click());
      realFileInput.addEventListener('change', () => {
        if (realFileInput.files && realFileInput.files.length > 0) {
          triggerUploadBtn.innerHTML = "📁 " + realFileInput.files[0].name;
          triggerUploadBtn.style.borderColor = "#10b981";
          triggerUploadBtn.style.color = "#10b981";
        } else {
          triggerUploadBtn.innerHTML = "Select Evidence File";
          triggerUploadBtn.style.borderColor = "";
          triggerUploadBtn.style.color = "";
        }
      });
    }

    document.getElementById('btnSubmitSpam').addEventListener('click', () => {
      const targetName = document.getElementById('reportCompanyName').value.trim();
      if (targetName === "") {
        alert("Please fill in the company name.");
        return;
      }
      const btn = document.getElementById('btnSubmitSpam');
      btn.innerHTML = `Processing Report...`;
      btn.disabled = true;

      setTimeout(() => {
        const existing = blacklistCompanies.find(c => c.name.toLowerCase() === targetName.toLowerCase());
        if (existing) {
          existing.reports += 1;
        } else {
          blacklistCompanies.push({ name: targetName, reports: 1 });
        }
        updateShameList();

        const modalBox = btn.closest('.modal-box');
        modalBox.innerHTML = `
                <h2>🛡️ Report Logged Successfully</h2>
                <p style="margin: 1.5rem 0; color: #e5e7eb;">Thank you. The report has been added to our verification queue. <strong>${targetName}</strong>'s rank on the Wall of Shame has been updated dynamically.</p>
                <button class="btn-action-report" onclick="this.closest('.modal-overlay').remove()">Close</button>
            `;
      }, 1500);
    });
  }

  document.querySelectorAll('header nav a').forEach(link => {
    const text = link.textContent ? link.textContent.trim().toLowerCase() : '';

    link.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();

      if (text === 'about') {
        openDirectAboutModal();
      } else if (text === 'company audit') {
        openDirectAuditModal();
      } else if (text === 'report spam') {
        openDirectReportModal();
      }
    });
  });

  document.addEventListener('click', function(e) {
    if (e.target && (e.target.id === 'searchBtn' || e.target.closest('#searchBtn') || e.target.closest('.search-box button'))) {
      e.preventDefault();
      performSearch();
    }
  });

  const searchInputField = document.querySelector('.search-box input');
  if (searchInputField) {
    searchInputField.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        performSearch();
      }
    });
  }

  function renderSponsors() {
    const grid = document.getElementById('sponsorsGrid');
    if (!grid) return;

    let htmlContent = "";

    if (window.officialSponsors && window.officialSponsors.length > 0) {
      window.officialSponsors.forEach(sponsor => {
        htmlContent += `
          <div class="sponsor-card gold-badge">
            <span class="badge-icon">${sponsor.icon}</span>
            <div class="sponsor-info">
              <span class="sponsor-name">${sponsor.name}</span>
              <span class="sponsor-status">Verified Sponsor</span>
            </div>
          </div>
        `;
      });
    }

    htmlContent += `
      <div class="sponsor-card gold-badge" style="border-style: dashed; background: transparent; justify-content: center; width: 100%; max-width: 500px; margin: 0 auto;">
        <div class="sponsor-info" style="text-align: center;">
          <span class="sponsor-name" style="color: #d97706; font-size: 0.95rem; display: block;">🏆 Become an Official Privacy Sponsor</span>
          <span class="sponsor-status" style="color: #9ca3af; margin-top: 0.25rem; display: block; line-height: 1.4; font-size: 0.85rem;">This space is strictly reserved for legitimate privacy-first organizations, cybersecurity firms, and open-source networks (e.g., Brave, NordVPN) that actively support digital freedom. To verify your status and award the official sponsor badge, make a support donation of 0.005 BTC and include your organization's memo/note. Malafide data brokers or spam organizations are strictly banned from verification.</span>
        </div>
      </div>
    `;

    grid.innerHTML = htmlContent;
  }

  function addNewSponsor(companyName, companyIcon = "🏢") {
    if (window.officialSponsors) {
      window.officialSponsors.push({ name: companyName, icon: companyIcon });
      renderSponsors();
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(renderSponsors, 500);
  });
  window.addEventListener('load', () => {
    setTimeout(renderSponsors, 1500);
  });

  function openDirectAboutModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-box">
            <h2>🎯 Our Mission Statement</h2>
            <p class="modal-intro">The foundational pillars of the Beta Application global initiative:</p>
            <div class="letter-preview">
                <p><strong>To:</strong> Global Consumers & Digital Citizens</p>
                <br>
                <p>Every single day, trillions of unsolicited spam messages and cold calls clutter communication networks worldwide. Beta Application was founded with a singular, rebellious mission: to turn the tables on data brokers and illicit callcenters.</p>
                <br>
                <p>By exposing non-compliant entities on our global Wall of Shame and empowering citizens with one-click automated Opt-Out requests, we make spamming too expensive, legally risky, and reputationally damaging to sustain.</p>
                <br>
                <p>Your data belongs to you—it is time to lock the envelope.</p>
            </div>
            <div class="modal-actions" style="justify-content: flex-end;">
                <button class="btn-action-report" onclick="this.closest('.modal-overlay').remove()">Close Window</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
  }

  function openDirectAuditModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-box" style="max-width: 650px;">
            <h2>⚖️ Company Audit Procedure</h2>
            <p class="modal-intro">The transparent legal compliance framework for listed companies:</p>
            <div class="letter-preview" style="max-height: 200px;">
                <p><strong>To:</strong> Legal Departments & Compliance Officers</p>
                <br>
                <p>We are strictly against digital extortion. Beta Application operates with absolute legal integrity. If your company has been listed on our Wall of Shame, we provide a transparent, objective compliance audit to clean your record entirely free of charge.</p>
                <br>
                <p>To be removed from the database, your legal department must supply cryptographic or logged proof of explicit user consent (Opt-In), verify the immediate purging of the claimant's records (Right to be Forgotten), and submit to our automated data-handling guidelines.</p>
                <br>
                <p>Compliance is the only way out.</p>
            </div>
            <div style="background-color: rgba(217, 119, 6, 0.05); border: 1px solid rgba(217, 119, 6, 0.2); padding: 1.25rem; border-radius: 8px; margin: 1.5rem 0; text-align: left;">
                <p style="color: #d97706; font-weight: 700; font-size: 0.95rem; margin-bottom: 0.75rem;">🏢 Submit Compliance Documents</p>
                <div class="form-group" style="margin-bottom: 1rem;">
                    <label style="font-size: 0.8rem; color: #cbd5e1;">Official Company Email</label>
                    <input type="email" id="auditCompanyEmail" placeholder="legal@yourcompany.com" style="width: 100%; background-color: #0b111e; border: 1px solid #1f2a3c; padding: 0.5rem; border-radius: 6px; color: #ffffff; font-family: inherit;">
                </div>
                <label style="display: block; font-size: 0.8rem; font-weight: 600; margin-bottom: 0.5rem; color: #cbd5e1;">Upload Cryptographic Logs / PDF Audit Report:</label>
                <input type="file" id="realAuditFileInput" accept=".pdf,.txt,.log" style="display: none;">
                <div class="fake-upload-btn" id="triggerAuditUploadBtn" style="border-color: #d97706; color: #d97706; background-color: rgba(217, 119, 6, 0.02);">Select Compliance File (.pdf, .log, .txt)</div>
            </div>
            <div class="modal-actions">
                <button class="btn-confirm-send" id="btnSubmitAudit" style="background-color: #d97706; flex: 2;">Submit Audit Application</button>
                <button class="btn-close-modal" onclick="this.closest('.modal-overlay').remove()" style="flex: 1;">Cancel</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    const realAuditFileInput = document.getElementById('realAuditFileInput');
    const triggerAuditUploadBtn = document.getElementById('triggerAuditUploadBtn');

    if (triggerAuditUploadBtn && realAuditFileInput) {
      triggerAuditUploadBtn.addEventListener('click', () => realAuditFileInput.click());
      realAuditFileInput.addEventListener('change', () => {
        if (realAuditFileInput.files && realAuditFileInput.files.length > 0) {
          triggerAuditUploadBtn.innerHTML = "📁 " + realAuditFileInput.files[0].name;
          triggerAuditUploadBtn.style.borderColor = "#10b981";
          triggerAuditUploadBtn.style.color = "#10b981";
        } else {
          triggerAuditUploadBtn.innerHTML = "Select Compliance File (.pdf, .log, .txt)";
          triggerAuditUploadBtn.style.borderColor = "#d97706";
          triggerAuditUploadBtn.style.color = "#d97706";
        }
      });
    }

    document.getElementById('btnSubmitAudit').addEventListener('click', () => {
      const companyEmail = document.getElementById('auditCompanyEmail').value.trim();
      if (companyEmail === "") {
        alert("Please fill in your official corporate email address.");
        return;
      }
      const btn = document.getElementById('btnSubmitAudit');
      btn.innerHTML = `Verifying Documents...`;
      btn.disabled = true;

      setTimeout(() => {
        const modalBox = btn.closest('.modal-box');
        modalBox.innerHTML = `
                <h2>⏳ Audit Under Review</h2>
                <p style="margin: 1.5rem 0; color: #e5e7eb;">Thank you. Your compliance files and cryptographic data logs have been securely submitted to our verification server. Our legal team will review the evidence within 7 business days.</p>
                <button class="btn-action-report" onclick="this.closest('.modal-overlay').remove()">Return to Index</button>
            `;
      }, 2000);
    });
  }

  function closeModal() {
    const overlay = document.querySelector('.modal-overlay');
    if (overlay) overlay.remove();
  }

  function openDirectReportModal(prefilledName = "") {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-box">
            <h2>🔴 Report Unsolicited Spam</h2>
            <p class="modal-intro">Submit verified evidence to add this entity to the global Wall of Shame.</p>
            <div class="form-group">
                <label>Company / Instance Name</label>
                <input type="text" id="reportCompanyName" value="${prefilledName}" placeholder="e.g. Shady Leads Corp">
            </div>
            <div class="form-group">
                <label>Spam Type</label>
                <select id="reportSpamType">
                    <option value="email">Unsolicited Email (Spam)</option>
                    <option value="call">Cold Calling / Callcenter</option>
                    <option value="sms">Unwanted SMS / WhatsApp</option>
                    <option value="selling">Verified Data Selling/Trading</option>
                </select>
            </div>
            <div class="form-group">
                <label>Your Email (Kept Strictly Confidential)</label>
                <input type="email" id="reportUserEmail" placeholder="yourname@example.com">
            </div>
            <div class="form-group">
                <label>Upload Evidence (Screenshot of email or call log)</label>
                <input type="file" id="realFileInput" accept="image/*" style="display: none;">
                <div class="fake-upload-btn" id="triggerUploadBtn">Select Evidence File</div>
            </div>
            <div class="modal-actions" style="margin-top: 1.5rem;">
                <button class="btn-confirm-send" id="btnSubmitSpam">File Official Report</button>
                <button class="btn-close-modal" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    const realFileInput = document.getElementById('realFileInput');
    const triggerUploadBtn = document.getElementById('triggerUploadBtn');

    if (triggerUploadBtn && realFileInput) {
      triggerUploadBtn.addEventListener('click', () => realFileInput.click());
      realFileInput.addEventListener('change', () => {
        if (realFileInput.files && realFileInput.files.length > 0) {
          triggerUploadBtn.innerHTML = "📁 " + realFileInput.files[0].name;
          triggerUploadBtn.style.borderColor = "#10b981";
          triggerUploadBtn.style.color = "#10b981";
        } else {
          triggerUploadBtn.innerHTML = "Select Evidence File";
          triggerUploadBtn.style.borderColor = "";
          triggerUploadBtn.style.color = "";
        }
      });
    }

    document.getElementById('btnSubmitSpam').addEventListener('click', () => {
      const targetName = document.getElementById('reportCompanyName').value.trim();
      if (targetName === "") {
        alert("Please fill in the company name.");
        return;
      }
      const btn = document.getElementById('btnSubmitSpam');
      btn.innerHTML = `Processing Report...`;
      btn.disabled = true;

      setTimeout(() => {
        const existing = blacklistCompanies.find(c => c.name.toLowerCase() === targetName.toLowerCase());
        if (existing) {
          existing.reports += 1;
        } else {
          blacklistCompanies.push({ name: targetName, reports: 1 });
        }
        updateShameList();

        const modalBox = btn.closest('.modal-box');
        modalBox.innerHTML = `
                <h2>🛡️ Report Logged Successfully</h2>
                <p style="margin: 1.5rem 0; color: #e5e7eb;">Thank you. The report has been added to our verification queue. <strong>${targetName}</strong>'s rank on the Wall of Shame has been updated dynamically.</p>
                <button class="btn-action-report" onclick="this.closest('.modal-overlay').remove()">Close</button>
            `;
      }, 1500);
    });
  }

  refreshGlobalShameList();

  function sendOptOut(companyName) {
    const companyEmails = {
      "Global Data Broker Inc.": "compliance@globaldatabroker.com",
      "EuroCall Center B.V.": "privacy@eurocallcenter.nl",
      "Apex Marketing Group": "legal@apexmarketing.com",
      "LeadGen Logistics": "optout@leadgenlogistics.com",
      "DirectConnect Media": "data@directconnect.com",
      "TeleSales Solutions": "compliance@telesales.com",
      "ConsumerData Ltd.": "privacy@consumerdata.co.uk",
      "ValidLeads Network": "legal@validleads.net",
      "SpamWave Agency": "optout@spamwave.com",
      "TargetedLists Corp.": "privacy@targetedlists.com"
    };

    const targetEmail = autoCreateEmail(companyName);
    const trackingId = "SDS-" + Math.floor(100000 + Math.random() * 900000);
    const emailSubject = encodeURIComponent(`Official Data Deletion and Opt-Out Request [ID: ${trackingId}]`);
    const emailBody = encodeURIComponent(`To the Privacy / Data Protection Officer,

This is an official data deletion and opt-out request submitted via the Consumer Compliance Network.

Under international privacy regulations (including GDPR Article 17 "Right to be Forgotten", GDPR Article 21 "Right to Object", and CCPA/CPRA regulations), I hereby instruct your organization to:

1. Immediately stop sharing, renting, transferring, or selling any personal data associated with my identity to any third parties.
2. Permanently erase all my personal records, including names, emails, and phone numbers, from your active databases and backup systems.
3. Provide full transparency regarding the exact source from which your organization originally acquired my data.

User Reference Details:
* Tracking ID: ${trackingId}
* Sent via: Consumer Compliance Network (Beta Application)

Please confirm compliance within the legally required 30-day window. Failure to comply will result in an automated escalation on our public global database.

Sincerely,
Digital Citizen`);

    const mailtoUrl = `mailto:${targetEmail}?subject=${emailSubject}&body=${emailBody}`;

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-box">
            <h2>✉️ Ready to Dispatch</h2>
            <p class="modal-intro">Clicking confirm will automatically open your local email app with the encrypted legal letter pre-filled for <strong>${companyName}</strong>:</p>
            <div class="letter-preview">
                <p><strong>To:</strong> ${targetEmail}</p>
                <p><strong>Subject:</strong> Official Data Deletion Request [ID: ${trackingId}]</p>
                <br>
                <p>Under GDPR Art. 17/21 & CCPA, we instruct your organization to immediately cease selling or sharing any personal data linked to this user and permanently erase their records.</p>
            </div>
            <div class="modal-actions" style="margin-top: 1.5rem;">
                <button class="btn-confirm-send" id="btnFinalConfirmMail">Confirm & Open Email App</button>
                <button class="btn-close-modal" id="btnCancelModal">Cancel</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('btnFinalConfirmMail').addEventListener('click', () => {
      window.open(mailtoUrl, '_blank');
      if (typeof window.sendCloudReport === 'function') {
        window.sendCloudReport(companyName);
      }
      confirmDelivery(document.getElementById('btnFinalConfirmMail'));
    });

    document.getElementById('btnCancelModal').addEventListener('click', () => {
      closeModal();
    });
  }

  window.confirmDelivery = function(button) {
    button.innerHTML = "Opening Mail Client...";
    button.disabled = true;
    setTimeout(() => {
      const modalBox = button.closest('.modal-box');
      if (modalBox) {
        modalBox.innerHTML = `
<h2>🛡️ Letter Prepared &amp; Dispatched</h2>
<p style="margin: 1.5rem 0; color: #e5e7eb; line-height: 1.6; text-align: left; font-size: 0.9rem;">
  <strong>Important Safeguard:</strong> The legal opt-out notice has been generated successfully. Please make sure to send the pre-filled message in your local email app.
  <br><br>
  <span style="color: #d97706; font-weight: bold;">⚠️ Action Required:</span> Keep this email receipt and any server logs safely for at least <strong>30 days</strong> as compliance evidence under privacy law guidelines. If the company continues to spam you, file a new report on this website to increase their Wall Of Shame Rank.
</p>
<div style="text-align: center; color: #9ca3af; font-size: 0.8rem; margin-top: 1rem; border-top: 1px solid #374151;">
  This window will close automatically in 10 seconds...
</div>
`;
        setTimeout(() => {
          closeModal();
        }, 10000);
      }
    }, 1000);
  };

  function closeModal() {
    const overlay = document.querySelector('.modal-overlay');
    if (overlay) overlay.remove();
  }

  refreshGlobalShameList();

  window.sendOptOut = sendOptOut;
  window.openDirectReportModal = openDirectReportModal;
  window.confirmDelivery = confirmDelivery;
})();