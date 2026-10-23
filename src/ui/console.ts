/**
 * Operations & Technical Console UI
 * Clean, enterprise white aesthetic (Stripe / Linear / Datadog style)
 * Served at /console
 */

export function getConsoleHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tactiron Operations Console</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
    body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    code, pre { font-family: 'JetBrains Mono', monospace; }
  </style>
</head>
<body class="bg-gray-50 text-gray-900 min-h-screen flex flex-col antialiased">

  <!-- Top Navigation Bar (Clean Enterprise White) -->
  <header class="bg-white border-b border-gray-200 px-6 py-3.5 flex items-center justify-between sticky top-0 z-50 shadow-sm">
    <div class="flex items-center space-x-4">
      <div class="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white font-bold text-sm">
        <i class="fa-solid fa-tower-broadcast text-xs"></i>
      </div>
      <div>
        <div class="flex items-center space-x-2">
          <span class="font-bold text-base text-gray-900 tracking-tight">Tactiron Outbound Ops Console</span>
          <span id="systemStatusBadge" class="text-xs px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 font-medium flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-emerald-500"></span> Active
          </span>
        </div>

      </div>
    </div>

    <!-- Review Mode & Emergency Stop -->
    <div class="flex items-center space-x-3">
      <div class="hidden sm:flex items-center space-x-2 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-md text-xs text-gray-600">
        <span class="text-gray-400">Review Mode:</span>
        <span class="font-semibold text-gray-800">Month 1 (100% Pre-Dispatch QA)</span>
      </div>

      <button id="killSwitchBtn" onclick="toggleKillSwitch()" class="px-3.5 py-1.5 rounded-md font-semibold text-xs transition-colors flex items-center gap-1.5 bg-white text-rose-600 border border-rose-300 hover:bg-rose-50 shadow-sm">
        <i class="fa-solid fa-power-off text-xs"></i>
        <span id="killSwitchText">Emergency Stop</span>
      </button>
    </div>
  </header>

  <!-- Main Container -->
  <div class="flex-1 flex overflow-hidden">
    <!-- Clean Sidebar Navigation -->
    <aside class="w-60 bg-white border-r border-gray-200 flex flex-col justify-between p-3.5">
      <nav class="space-y-1">
        <button onclick="switchTab('dashboard')" id="nav-dashboard" class="tab-btn w-full flex items-center space-x-2.5 px-3 py-2 rounded-md text-xs font-semibold transition text-gray-900 bg-gray-100 border border-gray-200">
          <i class="fa-solid fa-chart-pie w-4 text-gray-600 text-center"></i>
          <span>Overview &amp; KPIs</span>
        </button>

        <button onclick="switchTab('apollo')" id="nav-apollo" class="tab-btn w-full flex items-center space-x-2.5 px-3 py-2 rounded-md text-xs font-semibold transition text-gray-600 hover:text-gray-900 hover:bg-gray-50">
          <i class="fa-solid fa-magnifying-glass w-4 text-gray-500 text-center"></i>
          <span>Apollo Lead Discovery</span>
        </button>

        <button onclick="switchTab('csv-import')" id="nav-csv-import" class="tab-btn w-full flex items-center space-x-2.5 px-3 py-2 rounded-md text-xs font-semibold transition text-gray-600 hover:text-gray-900 hover:bg-gray-50">
          <i class="fa-solid fa-file-csv w-4 text-gray-500 text-center"></i>
          <span>Apollo CSV Import</span>
        </button>

        <button onclick="switchTab('simulator')" id="nav-simulator" class="tab-btn w-full flex items-center space-x-2.5 px-3 py-2 rounded-md text-xs font-semibold transition text-gray-600 hover:text-gray-900 hover:bg-gray-50">
          <i class="fa-solid fa-vial-circle-check w-4 text-gray-500 text-center"></i>
          <span>Reply &amp; Guardrail Lab</span>
        </button>

        <button onclick="switchTab('automation')" id="nav-automation" class="tab-btn w-full flex items-center space-x-2.5 px-3 py-2 rounded-md text-xs font-semibold transition text-gray-600 hover:text-gray-900 hover:bg-gray-50">
          <i class="fa-solid fa-gears w-4 text-gray-500 text-center"></i>
          <span>Automation Settings</span>
        </button>

        <button onclick="switchTab('handovers')" id="nav-handovers" class="tab-btn w-full flex items-center space-x-2.5 px-3 py-2 rounded-md text-xs font-semibold transition text-gray-600 hover:text-gray-900 hover:bg-gray-50">
          <i class="fa-solid fa-address-book w-4 text-gray-500 text-center"></i>
          <span>Odoo CRM Handovers</span>
        </button>

        <button onclick="switchTab('whatsapp')" id="nav-whatsapp" class="tab-btn w-full flex items-center space-x-2.5 px-3 py-2 rounded-md text-xs font-semibold transition text-gray-600 hover:text-gray-900 hover:bg-gray-50">
          <i class="fa-brands fa-whatsapp w-4 text-emerald-600 text-center"></i>
          <span>WhatsApp AI Live</span>
        </button>

        <button onclick="switchTab('compliance')" id="nav-compliance" class="tab-btn w-full flex items-center space-x-2.5 px-3 py-2 rounded-md text-xs font-semibold transition text-gray-600 hover:text-gray-900 hover:bg-gray-50">
          <i class="fa-solid fa-scale-balanced w-4 text-gray-500 text-center"></i>
          <span>Compliance &amp; Policy</span>
        </button>
      </nav>

      <!-- Connection Status Card -->
      <div class="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs space-y-1.5">
        <div class="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Integrations</div>
        <div class="flex items-center justify-between text-gray-600">
          <span>Odoo CRM:</span>
          <span class="text-emerald-700 font-semibold flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Connected</span>
        </div>
        <div class="flex items-center justify-between text-gray-600">
          <span>Smartlead:</span>
          <span class="text-emerald-700 font-semibold flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Ready</span>
        </div>
        <div class="flex items-center justify-between text-gray-600">
          <span>WhatsApp (Odoo):</span>
          <span class="text-emerald-700 font-semibold flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Native Active</span>
        </div>
        <div class="flex items-center justify-between text-gray-600">
          <span>Classifier:</span>
          <span class="text-gray-900 font-semibold">Claude 3.5</span>
        </div>
      </div>
    </aside>

    <!-- Main Workspace -->
    <main class="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 bg-gray-50">

      <!-- ================= TAB 1: OVERVIEW & KPIS ================= -->
      <section id="tab-dashboard" class="space-y-6">
        <div>
          <h2 class="text-xl font-bold text-gray-900 tracking-tight">System Performance &amp; Operational Health</h2>
          <p class="text-xs text-gray-500">Pipeline throughput, compliance enforcement, and human handover response targets.</p>
        </div>

        <!-- Metric Cards Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <div class="flex items-center justify-between text-gray-500 text-xs font-semibold uppercase tracking-wider">
              <span>Leads Handed Over</span>
              <i class="fa-solid fa-handshake text-gray-400"></i>
            </div>
            <div class="mt-2 flex items-baseline gap-2">
              <span id="metric-handovers" class="text-2xl font-bold text-gray-900">0</span>
              <span class="text-xs text-emerald-600 font-semibold">To Sales Reps</span>
            </div>
            <p class="mt-1 text-xs text-gray-500">Synced to Odoo with full 6-item pack</p>
          </div>

          <div class="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <div class="flex items-center justify-between text-gray-500 text-xs font-semibold uppercase tracking-wider">
              <span>Missed Escalations</span>
              <i class="fa-solid fa-circle-exclamation text-gray-400"></i>
            </div>
            <div class="mt-2 flex items-baseline gap-2">
              <span id="metric-missed" class="text-2xl font-bold text-gray-900">0</span>
              <span class="text-xs text-emerald-600 font-semibold">On Target (0)</span>
            </div>
            <p class="mt-1 text-xs text-gray-500">Any missed trigger requires investigation</p>
          </div>

          <div class="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <div class="flex items-center justify-between text-gray-500 text-xs font-semibold uppercase tracking-wider">
              <span>Outreach Permitted</span>
              <i class="fa-solid fa-shield-halved text-gray-400"></i>
            </div>
            <div class="mt-2 flex items-baseline gap-2">
              <span id="metric-permitted" class="text-2xl font-bold text-gray-900">100%</span>
              <span class="text-xs text-blue-600 font-semibold">Passed Gates</span>
            </div>
            <p class="mt-1 text-xs text-gray-500">Verified lawful basis &amp; unsuppressed</p>
          </div>

          <div class="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <div class="flex items-center justify-between text-gray-500 text-xs font-semibold uppercase tracking-wider">
              <span>Min Fleet Size</span>
              <i class="fa-solid fa-users text-gray-400"></i>
            </div>
            <div class="mt-2 flex items-baseline gap-2">
              <span id="metric-teamsize" class="text-2xl font-bold text-gray-900">20+</span>
              <span class="text-xs text-gray-600 font-semibold">Employees</span>
            </div>
            <p class="mt-1 text-xs text-gray-500">Excel qualification threshold</p>
          </div>
        </div>

        <!-- SLA Response Targets Table -->
        <div class="bg-white border border-gray-200 rounded-lg p-5 space-y-3 shadow-sm">
          <div class="flex items-center justify-between">
            <h3 class="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
              <i class="fa-regular fa-clock text-gray-500"></i> Response Target SLAs (AI-to-Human Handover Rules)
            </h3>
            <span class="text-xs text-gray-500">From approved rules spreadsheet</span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
            <div class="border border-gray-200 bg-gray-50/60 p-3.5 rounded-lg space-y-1">
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-rose-700 uppercase tracking-wide">Urgent Priority</span>
                <span class="text-xs bg-rose-50 text-rose-700 px-2 py-0.5 rounded border border-rose-200 font-semibold">&lt; 1 Hour</span>
              </div>
              <h4 class="font-semibold text-gray-900 text-xs">Demo / Meeting Requests</h4>
              <p class="text-xs text-gray-500 leading-relaxed">Highest-priority buying signal. Sales rep contacts within 1 hour; AI sends one holding reply.</p>
            </div>

            <div class="border border-gray-200 bg-gray-50/60 p-3.5 rounded-lg space-y-1">
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-amber-700 uppercase tracking-wide">Standard Priority</span>
                <span class="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded border border-amber-200 font-semibold">&lt; 4 Hours</span>
              </div>
              <h4 class="font-semibold text-gray-900 text-xs">Pricing, Contracts, SLAs &amp; Partners</h4>
              <p class="text-xs text-gray-500 leading-relaxed">AI is strictly barred from quoting prices. AI dispatches holding message; sales rep prepares custom quote.</p>
            </div>

            <div class="border border-gray-200 bg-gray-50/60 p-3.5 rounded-lg space-y-1">
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-purple-700 uppercase tracking-wide">Compliance Route</span>
                <span class="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded border border-purple-200 font-semibold">&lt; 1 Business Day</span>
              </div>
              <h4 class="font-semibold text-gray-900 text-xs">Legal Threats, GDPR &amp; Complaints</h4>
              <p class="text-xs text-gray-500 leading-relaxed">Direct escalation to Compliance Officer (not sales). AI sends no sales message.</p>
            </div>
          </div>
        </div>
      </section>

      <!-- ================= TAB 2: APOLLO LEAD DISCOVERY ================= -->
      <section id="tab-apollo" class="space-y-6 hidden">
        <div>
          <h2 class="text-xl font-bold text-gray-900 tracking-tight">Apollo ICP Lead Discovery</h2>
          <p class="text-xs text-gray-500">Filter and search Apollo.io by target market, industry, and role with verified phone numbers, company dispatch lines, and compliance routing.</p>
        </div>

        <!-- Filter Form -->
        <div class="bg-white border border-gray-200 rounded-lg p-5 space-y-5 shadow-sm">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
            <!-- 1. Target Markets / Countries (Select or Type) -->
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider">1. Target Market / Country</label>
                <span class="text-[10px] text-gray-400 font-medium">Select or Type</span>
              </div>
              <div class="space-y-1.5 text-xs text-gray-700 bg-gray-50 border border-gray-200 p-3 rounded-md max-h-44 overflow-y-auto">
                <label class="flex items-center space-x-2 cursor-pointer">
                  <input type="checkbox" name="country" value="United Arab Emirates" checked class="rounded border-gray-300 text-slate-900 focus:ring-0">
                  <span>United Arab Emirates (GCC)</span>
                </label>
                <label class="flex items-center space-x-2 cursor-pointer">
                  <input type="checkbox" name="country" value="Saudi Arabia" checked class="rounded border-gray-300 text-slate-900 focus:ring-0">
                  <span>Saudi Arabia (GCC)</span>
                </label>
                <label class="flex items-center space-x-2 cursor-pointer">
                  <input type="checkbox" name="country" value="Kenya" checked class="rounded border-gray-300 text-slate-900 focus:ring-0">
                  <span>Kenya (East Africa)</span>
                </label>
                <label class="flex items-center space-x-2 cursor-pointer">
                  <input type="checkbox" name="country" value="Egypt" class="rounded border-gray-300 text-slate-900 focus:ring-0">
                  <span>Egypt (North Africa)</span>
                </label>
                <label class="flex items-center space-x-2 cursor-pointer">
                  <input type="checkbox" name="country" value="Qatar" class="rounded border-gray-300 text-slate-900 focus:ring-0">
                  <span>Qatar (GCC)</span>
                </label>
                <label class="flex items-center space-x-2 cursor-pointer">
                  <input type="checkbox" name="country" value="Germany" class="rounded border-gray-300 text-slate-900 focus:ring-0">
                  <span>Germany (Strict Opt-In Test)</span>
                </label>
                <label class="flex items-center space-x-2 cursor-pointer">
                  <input type="checkbox" name="country" value="United Kingdom" class="rounded border-gray-300 text-slate-900 focus:ring-0">
                  <span>United Kingdom (Europe)</span>
                </label>
              </div>
              <input type="text" id="apolloCustomMarkets" placeholder="Type custom countries (e.g. Oman, Kuwait, South Africa)..." class="w-full bg-gray-50 border border-gray-200 rounded-md p-2 text-xs text-gray-800 placeholder-gray-400 focus:bg-white focus:border-gray-400 focus:outline-none">
            </div>

            <!-- 2. Target Industry (Select or Type) -->
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider">2. Industry</label>
                <span class="text-[10px] text-gray-400 font-medium">Select or Type</span>
              </div>
              <div class="space-y-1.5 text-xs text-gray-700 bg-gray-50 border border-gray-200 p-3 rounded-md max-h-44 overflow-y-auto">
                <label class="flex items-center space-x-2 cursor-pointer">
                  <input type="checkbox" name="industry" value="Logistics and Transportation" checked class="rounded border-gray-300 text-slate-900 focus:ring-0">
                  <span>Logistics &amp; Transportation</span>
                </label>
                <label class="flex items-center space-x-2 cursor-pointer">
                  <input type="checkbox" name="industry" value="Freight & Cargo" checked class="rounded border-gray-300 text-slate-900 focus:ring-0">
                  <span>Freight &amp; Cargo Services</span>
                </label>
                <label class="flex items-center space-x-2 cursor-pointer">
                  <input type="checkbox" name="industry" value="Security & Guarding" class="rounded border-gray-300 text-slate-900 focus:ring-0">
                  <span>Security &amp; Guarding Fleet</span>
                </label>
                <label class="flex items-center space-x-2 cursor-pointer">
                  <input type="checkbox" name="industry" value="Courier & Delivery" class="rounded border-gray-300 text-slate-900 focus:ring-0">
                  <span>Courier &amp; Last-Mile Delivery</span>
                </label>
                <label class="flex items-center space-x-2 cursor-pointer">
                  <input type="checkbox" name="industry" value="Construction & Mining" class="rounded border-gray-300 text-slate-900 focus:ring-0">
                  <span>Construction &amp; Mining Fleet</span>
                </label>
                <label class="flex items-center space-x-2 cursor-pointer">
                  <input type="checkbox" name="industry" value="Transportation" class="rounded border-gray-300 text-slate-900 focus:ring-0">
                  <span>Transportation &amp; Spedition</span>
                </label>
              </div>
              <input type="text" id="apolloCustomIndustries" placeholder="Type custom industries (e.g. Utilities, Aviation Ground)..." class="w-full bg-gray-50 border border-gray-200 rounded-md p-2 text-xs text-gray-800 placeholder-gray-400 focus:bg-white focus:border-gray-400 focus:outline-none">
            </div>

            <!-- 3. Target Job Roles / Positions (Select or Type) -->
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider">3. Job Role / Position</label>
                <span class="text-[10px] text-gray-400 font-medium">Select or Type</span>
              </div>
              <!-- Role Quick-select Chips -->
              <div class="flex flex-wrap gap-1">
                <button type="button" onclick="toggleApolloRole('Operations Director')" class="px-2 py-0.5 rounded text-[11px] bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200 transition">+ Ops Director</button>
                <button type="button" onclick="toggleApolloRole('Fleet Manager')" class="px-2 py-0.5 rounded text-[11px] bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200 transition">+ Fleet Mgr</button>
                <button type="button" onclick="toggleApolloRole('Dispatch Manager')" class="px-2 py-0.5 rounded text-[11px] bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200 transition">+ Dispatch Mgr</button>
                <button type="button" onclick="toggleApolloRole('Head of Logistics')" class="px-2 py-0.5 rounded text-[11px] bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200 transition">+ Logistics Head</button>
                <button type="button" onclick="toggleApolloRole('Transport Manager')" class="px-2 py-0.5 rounded text-[11px] bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200 transition">+ Transport Mgr</button>
              </div>
              <textarea id="apolloTitles" rows="4" class="w-full bg-gray-50 border border-gray-200 rounded-md p-2.5 text-xs text-gray-800 font-mono focus:bg-white focus:border-gray-400 focus:outline-none">Operations Director
Fleet Manager
Dispatch Manager
Head of Logistics
Transport Manager</textarea>
              <span class="text-[11px] text-gray-400">One role per line or click chips above</span>
            </div>
          </div>

          <!-- Secondary Criteria: Team Size & Page -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-gray-100">
            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider">Minimum Fleet / Team Size</label>
              <input type="number" id="apolloMinTeam" value="20" class="mt-1 w-full bg-gray-50 border border-gray-200 rounded-md p-2 text-xs font-semibold text-gray-800 focus:bg-white focus:border-gray-400 focus:outline-none">
              <span class="text-[11px] text-gray-400">Excel qualification threshold is 20+</span>
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider">Batch Size Per Page</label>
              <input type="number" id="apolloPerPage" value="10" max="50" class="mt-1 w-full bg-gray-50 border border-gray-200 rounded-md p-2 text-xs text-gray-800 focus:bg-white focus:border-gray-400 focus:outline-none">
              <span class="text-[11px] text-gray-400">Maximum 50 records per query batch</span>
            </div>
          </div>

          <div class="pt-3 border-t border-gray-100 flex items-center justify-between">
            <span class="text-xs text-gray-500">Leads are extracted with contact phone, direct company line, and run through the Compliance Router.</span>
            <button onclick="runApolloDiscovery()" id="btnApolloSearch" class="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-md transition shadow-sm flex items-center gap-2">
              <i class="fa-solid fa-magnifying-glass text-xs"></i>
              <span>Discover &amp; Pipeline from Apollo</span>
            </button>
          </div>
        </div>

        <!-- Discovery Results -->
        <div id="apolloResultsContainer" class="bg-white border border-gray-200 rounded-lg p-5 space-y-4 shadow-sm hidden">
          <!-- Results Header & Stats -->
          <div class="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 pb-3 gap-2">
            <div>
              <h3 class="font-bold text-gray-900 text-xs uppercase tracking-wide">Apollo Discovery Results</h3>
              <p class="text-[11px] text-gray-500">Extracted contact coordinates, direct phone numbers, and automated compliance &amp; qualification classification.</p>
            </div>
            <div id="apolloResultStats" class="text-xs text-gray-600 space-x-2"></div>
          </div>

          <!-- Actions Bar: Select All & Push to Campaign + Export to CSV -->
          <div class="flex flex-col sm:flex-row sm:items-center justify-between bg-gray-50 border border-gray-200 rounded-md p-2.5 gap-2.5 text-xs">
            <div class="flex items-center space-x-3 text-gray-700">
              <label class="flex items-center space-x-1.5 cursor-pointer font-medium">
                <input type="checkbox" id="selectAllCheckbox" onchange="toggleSelectAllLeads(this.checked)" class="rounded border-gray-300 text-slate-900 focus:ring-0">
                <span>Select All (<span id="apolloSelectedCount" class="font-bold text-gray-900">0</span> selected)</span>
              </label>
              <span class="text-gray-300">|</span>
              <button type="button" onclick="selectOnlyEligibleLeads()" class="text-[11px] text-emerald-700 hover:text-emerald-800 font-semibold underline">Select Eligible Only</button>
              <button type="button" onclick="toggleSelectAllLeads(false)" class="text-[11px] text-gray-500 hover:text-gray-700 underline">Clear</button>
            </div>

            <div class="flex items-center space-x-2">
              <button type="button" onclick="pushSelectedToCampaign()" id="btnPushCampaign" class="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded transition shadow-sm flex items-center gap-1.5">
                <i class="fa-solid fa-paper-plane text-xs"></i>
                <span id="btnPushCampaignText">Select All &amp; Push to Campaign</span>
              </button>

              <button type="button" onclick="exportApolloResultsCsv()" id="btnExportCsv" class="px-3.5 py-1.5 bg-white hover:bg-gray-100 border border-gray-300 text-gray-700 font-semibold text-xs rounded transition shadow-sm flex items-center gap-1.5">
                <i class="fa-solid fa-file-arrow-down text-xs"></i>
                <span>Export to CSV</span>
              </button>
            </div>
          </div>

          <!-- Live Alert Banner for Actions -->
          <div id="apolloActionAlert" class="hidden p-3 rounded-md text-xs font-medium border flex items-center justify-between">
            <span id="apolloActionAlertText"></span>
            <button type="button" onclick="this.parentElement.classList.add('hidden')" class="text-gray-400 hover:text-gray-600 ml-2">&times;</button>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="bg-gray-50 text-gray-500 uppercase tracking-wider text-[11px] border-b border-gray-200">
                <tr>
                  <th class="p-3 w-8 text-center">
                    <span class="sr-only">Select</span>
                  </th>
                  <th class="p-3">Company</th>
                  <th class="p-3">Job Role / Position</th>
                  <th class="p-3">Name</th>
                  <th class="p-3">Email</th>
                  <th class="p-3">Phone Number</th>
                  <th class="p-3">Company Phone</th>
                  <th class="p-3">Country</th>
                  <th class="p-3">Industry</th>
                  <th class="p-3">Classification</th>
                </tr>
              </thead>
              <tbody id="apolloResultsTbody" class="divide-y divide-gray-100"></tbody>
            </table>
          </div>
        </div>
      </section>

      <!-- ================= TAB 3: APOLLO CSV IMPORT ================= -->
      <section id="tab-csv-import" class="space-y-6 hidden">
        <div>
          <h2 class="text-xl font-bold text-gray-900 tracking-tight">Apollo CSV Batch Importer</h2>
          <p class="text-xs text-gray-500">Import saved searches and exported lists from your Apollo seats directly into the pipeline.</p>
        </div>

        <div class="bg-white border border-gray-200 rounded-lg p-5 space-y-4 shadow-sm">
          <div class="space-y-1.5">
            <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider">Paste Apollo Export CSV Text</label>
            <textarea id="csvTextInput" rows="8" placeholder="First Name,Last Name,Title,Company,Email,Email Status,# Employees,Country,Website..." class="w-full bg-gray-50 border border-gray-200 rounded-md p-3 text-xs text-gray-800 font-mono focus:bg-white focus:border-gray-400 focus:outline-none"></textarea>
          </div>

          <div class="flex items-center justify-between">
            <button onclick="loadSampleCsv()" class="text-xs text-gray-600 hover:text-gray-900 underline font-medium">Load Sample Apollo CSV</button>
            <button onclick="submitCsvImport()" id="btnSubmitCsv" class="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-md transition shadow-sm flex items-center gap-2">
              <i class="fa-solid fa-cloud-arrow-up text-xs"></i>
              <span>Import &amp; Process CSV</span>
            </button>
          </div>

          <div id="csvResultBox" class="mt-3 p-3.5 rounded-md bg-gray-50 border border-gray-200 text-xs hidden"></div>
        </div>
      </section>

      <!-- ================= TAB 4: SIMULATOR & GUARDRAIL LAB ================= -->
      <section id="tab-simulator" class="space-y-6 hidden">
        <div>
          <h2 class="text-xl font-bold text-gray-900 tracking-tight">Inbound Reply & Guardrail Testing Lab</h2>
          <p class="text-xs text-gray-500">Test how prospect responses are classified, scan for the 7 Excel guardrail keywords, and inspect the Odoo Handover Pack.</p>
        </div>

        <!-- Quick Scenario Buttons -->
        <div class="space-y-2">
          <span class="text-xs font-bold uppercase tracking-wider text-gray-500">Preset Scenario Quick-Fill:</span>
          <div class="flex flex-wrap gap-2">
            <button onclick="fillSimulator('Hi, we have 45 fleet vehicles in Dubai. Can you schedule a demo tomorrow at 2 PM?')" class="px-3 py-1.5 bg-white hover:bg-gray-50 border border-gray-300 text-emerald-800 rounded-md text-xs font-semibold shadow-sm">
              Demo Request (&lt; 1h SLA)
            </button>
            <button onclick="fillSimulator('Please send me a quote and pricing sheet for 50 handheld devices.')" class="px-3 py-1.5 bg-white hover:bg-gray-50 border border-gray-300 text-amber-800 rounded-md text-xs font-semibold shadow-sm">
              Pricing Keyword Guardrail (&lt; 4h SLA)
            </button>
            <button onclick="fillSimulator('We are a telecom reseller in Nairobi interested in distributor margins.')" class="px-3 py-1.5 bg-white hover:bg-gray-50 border border-gray-300 text-blue-800 rounded-md text-xs font-semibold shadow-sm">
              Partner Inquiry (&lt; 4h SLA)
            </button>
            <button onclick="fillSimulator('This email violates GDPR. My lawyer will contact your company.')" class="px-3 py-1.5 bg-white hover:bg-gray-50 border border-gray-300 text-purple-800 rounded-md text-xs font-semibold shadow-sm">
              Legal/GDPR Escalation (&lt; 24h SLA)
            </button>
            <button onclick="fillSimulator('Please remove me from your list. Unsubscribe immediately.')" class="px-3 py-1.5 bg-white hover:bg-gray-50 border border-gray-300 text-rose-800 rounded-md text-xs font-semibold shadow-sm">
              Opt-Out / Unsubscribe (Auto Suppress)
            </button>
          </div>
        </div>

        <!-- Simulator Form & Output Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div class="bg-white border border-gray-200 rounded-lg p-5 space-y-4 shadow-sm">
            <h3 class="text-xs font-bold text-gray-900 uppercase tracking-wider">Simulated Inbound Message</h3>
            
            <div class="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label class="block text-gray-500 font-medium">Company Name</label>
                <input id="simCompany" value="Gulf Logistics Fleet LLC" class="mt-1 w-full bg-gray-50 border border-gray-200 rounded p-2 text-xs text-gray-800 focus:bg-white focus:outline-none">
              </div>
              <div>
                <label class="block text-gray-500 font-medium">Country</label>
                <select id="simCountry" class="mt-1 w-full bg-gray-50 border border-gray-200 rounded p-2 text-xs text-gray-800 focus:bg-white focus:outline-none">
                  <option value="AE">UAE (GCC)</option>
                  <option value="SA">Saudi Arabia (GCC)</option>
                  <option value="KE">Kenya (Africa)</option>
                  <option value="DE">Germany (Europe)</option>
                </select>
              </div>
              <div>
                <label class="block text-gray-500 font-medium">Contact Email</label>
                <input id="simEmail" value="operations@gulflogistics.ae" class="mt-1 w-full bg-gray-50 border border-gray-200 rounded p-2 text-xs text-gray-800 focus:bg-white focus:outline-none">
              </div>
              <div>
                <label class="block text-gray-500 font-medium">Fleet / Team Size</label>
                <input id="simTeamSize" type="number" value="45" class="mt-1 w-full bg-gray-50 border border-gray-200 rounded p-2 text-xs text-gray-800 focus:bg-white focus:outline-none">
              </div>
            </div>

            <div class="space-y-1">
              <label class="block text-xs font-medium text-gray-700">Reply Message Text</label>
              <textarea id="simReplyText" rows="4" class="w-full bg-gray-50 border border-gray-200 rounded-md p-2.5 text-xs text-gray-800 font-mono focus:bg-white focus:border-gray-400 focus:outline-none">Can we get a demo tomorrow at 2 PM for our 45 drivers?</textarea>
            </div>

            <button onclick="runSimulation()" id="btnRunSim" class="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-md transition shadow-sm flex items-center justify-center gap-2">
              <i class="fa-solid fa-play text-xs"></i>
              <span>Execute Reply &amp; Classification Test</span>
            </button>
          </div>

          <!-- Simulator Analysis Output -->
          <div id="simOutputBox" class="bg-white border border-gray-200 rounded-lg p-5 space-y-4 shadow-sm text-xs">
            <div class="flex items-center justify-between border-b border-gray-100 pb-2.5">
              <span class="text-xs font-bold text-gray-900 uppercase tracking-wider">Classification &amp; Handover Decision</span>
              <span id="simBadge" class="text-xs px-2.5 py-0.5 rounded font-bold uppercase bg-gray-100 text-gray-600 border border-gray-200">Ready</span>
            </div>

            <div id="simEmptyNotice" class="text-center py-10 text-gray-400 text-xs">
              Click "Execute Reply &amp; Classification Test" to inspect decisions.
            </div>

            <div id="simResultsContent" class="space-y-3 hidden">
              <div class="grid grid-cols-2 gap-3">
                <div class="p-3 bg-gray-50 rounded-md border border-gray-200">
                  <span class="text-gray-500 block text-[11px]">Reply Category:</span>
                  <span id="simCategory" class="font-bold text-gray-900 text-xs"></span>
                </div>
                <div class="p-3 bg-gray-50 rounded-md border border-gray-200">
                  <span class="text-gray-500 block text-[11px]">SLA Response Target:</span>
                  <span id="simSla" class="font-bold text-emerald-700 text-xs"></span>
                </div>
              </div>

              <div class="p-3 bg-gray-50 rounded-md border border-gray-200 space-y-1">
                <span class="text-gray-500 block text-[11px]">Guardrail Keyword Scan:</span>
                <div id="simKeywords" class="font-mono text-gray-800 font-semibold"></div>
              </div>

              <div class="p-3 bg-gray-50 rounded-md border border-gray-200 space-y-1">
                <span class="text-gray-500 block text-[11px]">Approved Holding Reply (If dispatched):</span>
                <p id="simHoldingReply" class="text-gray-700 italic"></p>
              </div>

              <div class="space-y-1">
                <span class="text-gray-500 block text-[11px] font-semibold">Odoo Handover Pack Description (Generated for Sales):</span>
                <pre id="simHandoverPackPreview" class="p-3 bg-gray-900 text-gray-100 rounded-md text-[11px] max-h-40 overflow-y-auto whitespace-pre-wrap font-mono"></pre>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ================= TAB: AUTOMATION SETTINGS ================= -->
      <section id="tab-automation" class="space-y-6 hidden">
        <div>
          <h2 class="text-xl font-bold text-gray-900 tracking-tight">Automation Settings</h2>
          <p class="text-xs text-gray-500">Configure outbound automation schedules, dispatch rules, retry logic, and campaign cadence parameters.</p>
        </div>

        <!-- Live Dispatch Worker & Queue Monitor Card -->
        <div class="bg-white border border-gray-200 rounded-lg p-5 space-y-4 shadow-sm">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-gray-100 gap-3">
            <div>
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <h3 class="text-xs font-bold text-gray-900 uppercase tracking-wider">Scheduled Queue Worker (node-cron)</h3>
              </div>
              <p class="text-[11px] text-gray-500 mt-0.5">Automated batch dispatch runner evaluating approved windows, daily caps, and retry cadence.</p>
            </div>

            <div class="flex items-center gap-2">
              <label class="flex items-center space-x-1.5 cursor-pointer text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded border border-gray-200">
                <input type="checkbox" id="chkForceWindow" class="rounded border-gray-300 text-slate-900 focus:ring-0">
                <span class="text-[11px]">Bypass Window for Test</span>
              </label>

              <button type="button" onclick="triggerBatchNow()" id="btnTriggerBatch" class="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded transition shadow-sm flex items-center gap-1.5">
                <i class="fa-solid fa-bolt text-xs"></i>
                <span>Trigger Batch Run Now</span>
              </button>
            </div>
          </div>

          <!-- 4 Worker Status Badges -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div class="p-3 bg-gray-50 border border-gray-200 rounded-md space-y-1">
              <span class="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Window Status</span>
              <div id="workerWindowBadge" class="flex items-center gap-1.5 font-bold text-gray-900">
                <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span id="workerWindowText">Checking...</span>
              </div>
              <p id="workerWindowDetail" class="text-[11px] text-gray-400">Loading timezone time...</p>
            </div>

            <div class="p-3 bg-gray-50 border border-gray-200 rounded-md space-y-1">
              <span class="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Today's Sent Cap</span>
              <div class="flex items-baseline gap-1.5 font-bold text-gray-900">
                <span id="workerSentToday" class="text-base text-gray-900">0</span>
                <span class="text-xs text-gray-500">/ <span id="workerDailyCap">50</span> Max</span>
              </div>
              <p id="workerRemainingCapacity" class="text-[11px] text-emerald-600 font-medium">50 sends remaining today</p>
            </div>

            <div class="p-3 bg-gray-50 border border-gray-200 rounded-md space-y-1">
              <span class="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Queue Backlog</span>
              <div class="flex items-baseline gap-1.5 font-bold text-gray-900">
                <span id="workerPendingCount" class="text-base text-blue-700">0</span>
                <span class="text-xs text-gray-500">Pending</span>
              </div>
              <p id="workerRetryingCount" class="text-[11px] text-amber-600 font-medium">0 retrying due to backoff</p>
            </div>

            <div class="p-3 bg-gray-50 border border-gray-200 rounded-md space-y-1">
              <span class="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Runner Cadence</span>
              <div class="flex items-baseline gap-1.5 font-bold text-gray-900">
                <span id="workerCadenceInterval" class="text-base text-gray-900">Every 15m</span>
              </div>
              <p class="text-[11px] text-gray-400">Automated node-cron scheduler</p>
            </div>
          </div>

          <!-- Alert / Batch Run Output Notification -->
          <div id="workerBatchAlert" class="hidden p-3 rounded-md text-xs font-medium border flex items-center justify-between">
            <span id="workerBatchAlertText"></span>
            <button type="button" onclick="this.parentElement.classList.add('hidden')" class="text-gray-400 hover:text-gray-600 ml-2">&times;</button>
          </div>
        </div>

        <!-- Dispatch Schedule -->
        <div class="bg-white border border-gray-200 rounded-lg p-5 space-y-4 shadow-sm">
          <h3 class="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
            <i class="fa-regular fa-clock text-gray-500"></i> Dispatch Schedule
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div class="space-y-1.5">
              <label class="block text-gray-500 font-medium">Sending Window Start</label>
              <input id="autoSendStart" type="time" value="08:00" class="w-full bg-gray-50 border border-gray-200 rounded-md p-2 text-xs text-gray-800 focus:bg-white focus:border-gray-400 focus:outline-none">
            </div>
            <div class="space-y-1.5">
              <label class="block text-gray-500 font-medium">Sending Window End</label>
              <input id="autoSendEnd" type="time" value="18:00" class="w-full bg-gray-50 border border-gray-200 rounded-md p-2 text-xs text-gray-800 focus:bg-white focus:border-gray-400 focus:outline-none">
            </div>
            <div class="space-y-1.5">
              <label class="block text-gray-500 font-medium">Timezone</label>
              <select id="autoTimezone" class="w-full bg-gray-50 border border-gray-200 rounded-md p-2 text-xs text-gray-800 focus:bg-white focus:border-gray-400 focus:outline-none">
                <option value="Asia/Dubai">Asia/Dubai (GST, UTC+4)</option>
                <option value="Asia/Riyadh">Asia/Riyadh (AST, UTC+3)</option>
                <option value="Africa/Nairobi">Africa/Nairobi (EAT, UTC+3)</option>
                <option value="Europe/Berlin">Europe/Berlin (CET, UTC+1)</option>
                <option value="UTC">UTC</option>
              </select>
            </div>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div class="space-y-1.5">
              <label class="block text-gray-500 font-medium">Send Days</label>
              <div class="flex flex-wrap gap-2 pt-1">
                <label class="flex items-center space-x-1.5 cursor-pointer"><input type="checkbox" name="autoDay" value="Mon" checked class="rounded border-gray-300 text-slate-900 focus:ring-0"><span>Mon</span></label>
                <label class="flex items-center space-x-1.5 cursor-pointer"><input type="checkbox" name="autoDay" value="Tue" checked class="rounded border-gray-300 text-slate-900 focus:ring-0"><span>Tue</span></label>
                <label class="flex items-center space-x-1.5 cursor-pointer"><input type="checkbox" name="autoDay" value="Wed" checked class="rounded border-gray-300 text-slate-900 focus:ring-0"><span>Wed</span></label>
                <label class="flex items-center space-x-1.5 cursor-pointer"><input type="checkbox" name="autoDay" value="Thu" checked class="rounded border-gray-300 text-slate-900 focus:ring-0"><span>Thu</span></label>
                <label class="flex items-center space-x-1.5 cursor-pointer"><input type="checkbox" name="autoDay" value="Fri" checked class="rounded border-gray-300 text-slate-900 focus:ring-0"><span>Fri</span></label>
                <label class="flex items-center space-x-1.5 cursor-pointer"><input type="checkbox" name="autoDay" value="Sat" class="rounded border-gray-300 text-slate-900 focus:ring-0"><span>Sat</span></label>
                <label class="flex items-center space-x-1.5 cursor-pointer"><input type="checkbox" name="autoDay" value="Sun" class="rounded border-gray-300 text-slate-900 focus:ring-0"><span>Sun</span></label>
              </div>
            </div>
            <div class="space-y-1.5">
              <label class="block text-gray-500 font-medium">Max Emails Per Day</label>
              <input id="autoMaxPerDay" type="number" value="50" class="w-full bg-gray-50 border border-gray-200 rounded-md p-2 text-xs text-gray-800 focus:bg-white focus:border-gray-400 focus:outline-none">
              <span class="text-[11px] text-gray-400">Smartlead daily cap per sending account</span>
            </div>
          </div>
        </div>

        <!-- Campaign Cadence -->
        <div class="bg-white border border-gray-200 rounded-lg p-5 space-y-4 shadow-sm">
          <h3 class="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
            <i class="fa-solid fa-arrows-spin text-gray-500"></i> Campaign Cadence &amp; Follow-up
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div class="space-y-1.5">
              <label class="block text-gray-500 font-medium">Follow-up Delay (Days)</label>
              <input id="autoFollowupDelay" type="number" value="3" min="1" max="30" class="w-full bg-gray-50 border border-gray-200 rounded-md p-2 text-xs text-gray-800 focus:bg-white focus:border-gray-400 focus:outline-none">
              <span class="text-[11px] text-gray-400">Days between sequence steps</span>
            </div>
            <div class="space-y-1.5">
              <label class="block text-gray-500 font-medium">Max Sequence Steps</label>
              <input id="autoMaxSteps" type="number" value="4" min="1" max="10" class="w-full bg-gray-50 border border-gray-200 rounded-md p-2 text-xs text-gray-800 focus:bg-white focus:border-gray-400 focus:outline-none">
              <span class="text-[11px] text-gray-400">Total touches before auto-closing lead</span>
            </div>
            <div class="space-y-1.5">
              <label class="block text-gray-500 font-medium">Batch Interval (Minutes)</label>
              <input id="autoBatchInterval" type="number" value="15" min="5" max="120" class="w-full bg-gray-50 border border-gray-200 rounded-md p-2 text-xs text-gray-800 focus:bg-white focus:border-gray-400 focus:outline-none">
              <span class="text-[11px] text-gray-400">Time between processing batches</span>
            </div>
          </div>
        </div>

        <!-- Retry & Error Handling -->
        <div class="bg-white border border-gray-200 rounded-lg p-5 space-y-4 shadow-sm">
          <h3 class="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
            <i class="fa-solid fa-rotate text-gray-500"></i> Retry &amp; Error Handling
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div class="space-y-1.5">
              <label class="block text-gray-500 font-medium">Max Retries on Failure</label>
              <input id="autoMaxRetries" type="number" value="3" min="0" max="10" class="w-full bg-gray-50 border border-gray-200 rounded-md p-2 text-xs text-gray-800 focus:bg-white focus:border-gray-400 focus:outline-none">
            </div>
            <div class="space-y-1.5">
              <label class="block text-gray-500 font-medium">Retry Backoff (Seconds)</label>
              <input id="autoRetryBackoff" type="number" value="60" min="10" max="600" class="w-full bg-gray-50 border border-gray-200 rounded-md p-2 text-xs text-gray-800 focus:bg-white focus:border-gray-400 focus:outline-none">
            </div>
            <div class="space-y-1.5">
              <label class="block text-gray-500 font-medium">On Bounce Action</label>
              <select id="autoOnBounce" class="w-full bg-gray-50 border border-gray-200 rounded-md p-2 text-xs text-gray-800 focus:bg-white focus:border-gray-400 focus:outline-none">
                <option value="suppress">Suppress Contact Immediately</option>
                <option value="retry_once">Retry Once, Then Suppress</option>
                <option value="flag">Flag for Manual Review</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Auto-Classification Thresholds -->
        <div class="bg-white border border-gray-200 rounded-lg p-5 space-y-4 shadow-sm">
          <h3 class="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
            <i class="fa-solid fa-sliders text-gray-500"></i> Auto-Classification Thresholds
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div class="space-y-1.5">
              <label class="block text-gray-500 font-medium">AI Confidence Threshold for Auto-Dispatch (%)</label>
              <input id="autoConfidenceThreshold" type="number" value="85" min="50" max="100" class="w-full bg-gray-50 border border-gray-200 rounded-md p-2 text-xs text-gray-800 focus:bg-white focus:border-gray-400 focus:outline-none">
              <span class="text-[11px] text-gray-400">Below this threshold, replies queue for human review</span>
            </div>
            <div class="space-y-1.5">
              <label class="block text-gray-500 font-medium">Pre-Dispatch QA Mode</label>
              <select id="autoQaMode" class="w-full bg-gray-50 border border-gray-200 rounded-md p-2 text-xs text-gray-800 focus:bg-white focus:border-gray-400 focus:outline-none">
                <option value="full_review">Month 1: 100% Human Review Before Dispatch</option>
                <option value="sample_review">Month 2+: 20% Sample Review</option>
                <option value="auto">Autonomous: AI Dispatches with Confidence Gate</option>
              </select>
              <span class="text-[11px] text-gray-400">Controls how much human oversight is applied</span>
            </div>
          </div>
        </div>

        <!-- Save Button -->
        <div class="flex items-center justify-end gap-3">
          <span id="autoSaveStatus" class="text-xs text-gray-400 hidden">Settings saved successfully.</span>
          <button onclick="saveAutomationSettings()" class="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-md transition shadow-sm flex items-center gap-2">
            <i class="fa-solid fa-floppy-disk text-xs"></i>
            <span>Save Automation Settings</span>
          </button>
        </div>
      </section>

      <!-- ================= TAB 5: ODOO HANDOVERS ================= -->
      <section id="tab-handovers" class="space-y-6 hidden">
        <div>
          <h2 class="text-xl font-bold text-gray-900 tracking-tight">Odoo CRM Handover Inspection</h2>
          <p class="text-xs text-gray-500">All warm leads and high-priority replies synchronized to Odoo CRM for sales reps.</p>
        </div>

        <div class="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="bg-gray-50 text-gray-500 uppercase tracking-wider text-[11px] border-b border-gray-200">
                <tr>
                  <th class="p-3">Odoo Lead ID</th>
                  <th class="p-3">Company</th>
                  <th class="p-3">Contact</th>
                  <th class="p-3">Priority</th>
                  <th class="p-3">Status</th>
                  <th class="p-3">Handover Time</th>
                </tr>
              </thead>
              <tbody id="handoversTbody" class="divide-y divide-gray-100">
                <tr>
                  <td colspan="6" class="p-6 text-center text-gray-400">No leads handed over yet in this session.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <!-- ================= TAB 6: COMPLIANCE MATRIX ================= -->
      <section id="tab-compliance" class="space-y-6 hidden">
        <div>
          <h2 class="text-xl font-bold text-gray-900 tracking-tight">Compliance Router &amp; Policy Matrix</h2>
          <p class="text-xs text-gray-500">Deterministic jurisdiction rules, channel allowances, and keyword triggers.</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
          <div class="bg-white border border-gray-200 rounded-lg p-5 space-y-3 shadow-sm">
            <h3 class="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
              <i class="fa-solid fa-key text-gray-500"></i> Mandatory Escalation Keywords (Sheet AI Guardrails)
            </h3>
            <p class="text-xs text-gray-500">Hitting any of these triggers immediate human escalation and bypasses AI response generation:</p>
            <div class="flex flex-wrap gap-1.5 pt-1">
              <span class="px-2.5 py-1 bg-gray-100 border border-gray-200 text-rose-700 rounded text-xs font-mono font-semibold">price</span>
              <span class="px-2.5 py-1 bg-gray-100 border border-gray-200 text-rose-700 rounded text-xs font-mono font-semibold">pricing</span>
              <span class="px-2.5 py-1 bg-gray-100 border border-gray-200 text-rose-700 rounded text-xs font-mono font-semibold">quote</span>
              <span class="px-2.5 py-1 bg-gray-100 border border-gray-200 text-rose-700 rounded text-xs font-mono font-semibold">contract</span>
              <span class="px-2.5 py-1 bg-gray-100 border border-gray-200 text-rose-700 rounded text-xs font-mono font-semibold">legal</span>
              <span class="px-2.5 py-1 bg-gray-100 border border-gray-200 text-rose-700 rounded text-xs font-mono font-semibold">gdpr</span>
              <span class="px-2.5 py-1 bg-gray-100 border border-gray-200 text-rose-700 rounded text-xs font-mono font-semibold">complaint</span>
              <span class="px-2.5 py-1 bg-gray-100 border border-gray-200 text-rose-700 rounded text-xs font-mono font-semibold">lawyer</span>
            </div>
          </div>

          <div class="bg-white border border-gray-200 rounded-lg p-5 space-y-3 shadow-sm">
            <h3 class="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
              <i class="fa-solid fa-earth-americas text-gray-500"></i> Market Channel Permissions
            </h3>
            <div class="text-xs space-y-2 text-gray-700">
              <div class="flex justify-between border-b border-gray-100 pb-1.5">
                <span>UAE / Saudi Arabia / Kenya / Egypt:</span>
                <span class="text-emerald-700 font-semibold">Email &amp; LinkedIn Allowed</span>
              </div>
              <div class="flex justify-between border-b border-gray-100 pb-1.5">
                <span>Germany (DE):</span>
                <span class="text-amber-700 font-semibold">LinkedIn Only (Cold Email Blocked: UWG §7)</span>
              </div>
              <div class="flex justify-between border-b border-gray-100 pb-1.5">
                <span>United Kingdom / France:</span>
                <span class="text-emerald-700 font-semibold">B2B Email Allowed (Legitimate Interest)</span>
              </div>
              <div class="flex justify-between">
                <span>WhatsApp Outreach:</span>
                <span class="text-rose-700 font-semibold">Strict Prior Opt-in Only</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ================= TAB 8: WHATSAPP AI LIVE ================= -->
      <section id="tab-whatsapp" class="space-y-6 hidden">
        <div>
          <div class="flex items-center gap-2">
            <h2 class="text-xl font-bold text-gray-900 tracking-tight">Odoo Native WhatsApp AI Assistant</h2>
            <span class="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 uppercase tracking-wide">24h Meta Window Active</span>
          </div>
          <p class="text-xs text-gray-500">Automated inbound responses for prospect-initiated WhatsApp chats via Odoo's native Discuss channel. Strictly enforces non-price quoting guardrails and 6-part Odoo CRM lead handover.</p>
        </div>

        <!-- WhatsApp Policy Banner -->
        <div class="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-xs text-emerald-900 space-y-2">
          <div class="font-bold flex items-center gap-2">
            <i class="fa-brands fa-whatsapp text-emerald-600 text-base"></i>
            <span>Meta WhatsApp Business &amp; Odoo Handover Policy</span>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3 text-emerald-800 text-[11px] pt-1">
            <div class="bg-white/80 p-2.5 rounded border border-emerald-100">
              <span class="font-bold block text-emerald-900">1. Inbound Only (Strict Opt-In)</span>
              We never initiate cold WhatsApp messages. We only respond to prospect-initiated chats routed from Odoo.
            </div>
            <div class="bg-white/80 p-2.5 rounded border border-emerald-100">
              <span class="font-bold block text-emerald-900">2. Same 7 Guardrails Enforced</span>
              The AI never quotes pricing or negotiates terms on WhatsApp. Holding replies are sent and sales is notified.
            </div>
            <div class="bg-white/80 p-2.5 rounded border border-emerald-100">
              <span class="font-bold block text-emerald-900">3. Email Outbound Auto-Suppression</span>
              Active WhatsApp chats pause automated email follow-ups to avoid awkward double-contacting.
            </div>
          </div>
        </div>

        <!-- Simulator & Live Feed Split -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- WhatsApp Interactive Simulator -->
          <div class="bg-white border border-gray-200 rounded-lg p-5 shadow-sm space-y-4">
            <div class="flex items-center justify-between border-b border-gray-100 pb-3">
              <div class="font-bold text-xs uppercase tracking-wider text-gray-600">Simulate WhatsApp Message</div>
              <i class="fa-solid fa-mobile-screen text-gray-400"></i>
            </div>

            <div class="space-y-3 text-xs">
              <div>
                <label class="block font-semibold text-gray-700 mb-1">Prospect Name</label>
                <input id="wa-sim-name" type="text" class="w-full border border-gray-300 rounded px-2.5 py-1.5 focus:border-emerald-500 focus:outline-none" value="Ahmed Al-Mansoor">
              </div>

              <div>
                <label class="block font-semibold text-gray-700 mb-1">Phone Number (E.164)</label>
                <input id="wa-sim-phone" type="text" class="w-full border border-gray-300 rounded px-2.5 py-1.5 focus:border-emerald-500 focus:outline-none" value="+971501234567">
              </div>

              <div>
                <label class="block font-semibold text-gray-700 mb-1">Linked Email (Optional)</label>
                <input id="wa-sim-email" type="email" class="w-full border border-gray-300 rounded px-2.5 py-1.5 focus:border-emerald-500 focus:outline-none" placeholder="ahmed@fleet.ae">
              </div>

              <div>
                <label class="block font-semibold text-gray-700 mb-1">Inbound WhatsApp Message</label>
                <textarea id="wa-sim-body" rows="3" class="w-full border border-gray-300 rounded px-2.5 py-1.5 focus:border-emerald-500 focus:outline-none" placeholder="Type WhatsApp message here...">Hello, we run 45 logistics trucks in Dubai and want a quote for your Push-to-Talk devices.</textarea>
              </div>

              <div class="flex gap-2 pt-1">
                <button onclick="setWaPrompt('pricing')" class="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-[11px] text-gray-700 font-medium">Pricing Guardrail</button>
                <button onclick="setWaPrompt('demo')" class="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-[11px] text-gray-700 font-medium">Demo Request</button>
                <button onclick="setWaPrompt('legal')" class="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-[11px] text-gray-700 font-medium">GDPR / Legal</button>
              </div>

              <button onclick="sendSimulatedWhatsApp()" id="wa-sim-btn" class="w-full mt-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 rounded text-xs transition flex items-center justify-center gap-1.5 shadow-sm">
                <i class="fa-solid fa-paper-plane"></i>
                <span>Send Inbound to AI</span>
              </button>
            </div>

            <!-- Simulation Result Card -->
            <div id="wa-sim-result" class="hidden border border-emerald-200 bg-emerald-50/50 rounded-lg p-3 text-xs space-y-2">
              <div class="font-bold text-emerald-900 flex items-center justify-between">
                <span>AI Processing Outcome</span>
                <span id="wa-res-type" class="px-1.5 py-0.5 rounded text-[10px] bg-emerald-200 text-emerald-800"></span>
              </div>
              <div class="text-[11px] text-gray-700 space-y-1">
                <div><span class="font-semibold text-gray-900">Reply Sent:</span> <span id="wa-res-reply" class="text-emerald-800 font-medium italic"></span></div>
                <div><span class="font-semibold text-gray-900">CRM Handover:</span> <span id="wa-res-crm" class="font-semibold"></span></div>
                <div><span class="font-semibold text-gray-900">Email Sequence:</span> <span class="text-amber-700 font-semibold">Paused (WhatsApp Active)</span></div>
              </div>
            </div>
          </div>

          <!-- Live WhatsApp Inbound Feed -->
          <div class="lg:col-span-2 bg-white border border-gray-200 rounded-lg shadow-sm flex flex-col">
            <div class="p-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 class="font-bold text-xs uppercase tracking-wider text-gray-700">Recent WhatsApp Inbound Conversations</h3>
                <p class="text-[11px] text-gray-500">Live conversation log processed through Odoo Discuss webhook</p>
              </div>
              <button onclick="loadWhatsAppConversations()" class="px-2.5 py-1 text-xs font-semibold text-gray-600 hover:text-gray-900 border border-gray-200 rounded bg-gray-50 hover:bg-gray-100 flex items-center gap-1">
                <i class="fa-solid fa-rotate-right"></i>
                <span>Refresh</span>
              </button>
            </div>

            <div class="flex-1 overflow-x-auto p-4">
              <table class="w-full text-left text-xs border-collapse">
                <thead>
                  <tr class="border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    <th class="pb-2">Prospect</th>
                    <th class="pb-2">Message</th>
                    <th class="pb-2">AI Classification</th>
                    <th class="pb-2">Reply Sent</th>
                    <th class="pb-2">Meta 24h Window</th>
                    <th class="pb-2">Odoo CRM</th>
                  </tr>
                </thead>
                <tbody id="wa-conversations-tbody" class="divide-y divide-gray-100 text-gray-700">
                  <tr>
                    <td colspan="6" class="py-6 text-center text-gray-400 italic">No WhatsApp conversations recorded yet. Use the simulator or send a webhook to test.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

    </main>
  </div>

  <!-- Client-side Logic Script -->
  <script>
    let isKillSwitch = false;

    function switchTab(tabId) {
      document.querySelectorAll('main > section').forEach(sec => sec.classList.add('hidden'));
      document.getElementById('tab-' + tabId).classList.remove('hidden');

      document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('text-gray-900', 'bg-gray-100', 'border-gray-200');
        btn.classList.add('text-gray-600');
      });

      const activeBtn = document.getElementById('nav-' + tabId);
      if (activeBtn) {
        activeBtn.classList.remove('text-gray-600');
        activeBtn.classList.add('text-gray-900', 'bg-gray-100', 'border-gray-200');
      }

      if (tabId === 'dashboard') loadKpis();
      if (tabId === 'handovers') loadHandovers();
      if (tabId === 'automation') loadAutomationSettings();
      if (tabId === 'whatsapp') loadWhatsAppConversations();
    }

    async function toggleKillSwitch() {
      const endpoint = isKillSwitch ? '/internal/campaigns/resume' : '/internal/campaigns/pause';
      const headers = isKillSwitch ? { 'Authorization': 'Bearer admin_authorized_token' } : {};

      try {
        const res = await fetch(endpoint, { method: 'POST', headers });
        const data = await res.json();
        isKillSwitch = data.killSwitchActive;
        updateKillSwitchUi();
      } catch (err) {
        alert('Failed to toggle kill switch: ' + err.message);
      }
    }

    function updateKillSwitchUi() {
      const btn = document.getElementById('killSwitchBtn');
      const text = document.getElementById('killSwitchText');
      const statusBadge = document.getElementById('systemStatusBadge');

      if (isKillSwitch) {
        btn.className = "px-3.5 py-1.5 rounded-md font-semibold text-xs tracking-wider uppercase bg-rose-600 text-white shadow-sm";
        text.innerText = "OUTBOUND FROZEN";
        statusBadge.className = "text-xs px-2 py-0.5 rounded bg-rose-50 border border-rose-200 text-rose-700 font-medium flex items-center gap-1.5";
        statusBadge.innerHTML = '<span class="w-2 h-2 rounded-full bg-rose-500"></span> ALL OUTBOUND FROZEN';
      } else {
        btn.className = "px-3.5 py-1.5 rounded-md font-semibold text-xs transition-colors flex items-center gap-1.5 bg-white text-rose-600 border border-rose-300 hover:bg-rose-50 shadow-sm";
        text.innerText = "Emergency Stop";
        statusBadge.className = "text-xs px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 font-medium flex items-center gap-1.5";
        statusBadge.innerHTML = '<span class="w-2 h-2 rounded-full bg-emerald-500"></span> Active';
      }
    }

    async function loadKpis() {
      try {
        const res = await fetch('/internal/kpis');
        if (res.ok) {
          const data = await res.json();
          document.getElementById('metric-handovers').innerText = data.leadsHandedOverCount || 0;
          document.getElementById('metric-missed').innerText = data.missedEscalations || 0;
        }
      } catch (err) {
        console.error('Error fetching KPIs', err);
      }
    }

    let currentApolloLeads = [];

    function toggleSelectAllLeads(checked) {
      document.querySelectorAll('.apollo-lead-check').forEach(chk => {
        chk.checked = checked;
      });
      const master = document.getElementById('selectAllCheckbox');
      if (master) master.checked = checked;
      updateSelectedCount();
    }

    function selectOnlyEligibleLeads() {
      document.querySelectorAll('.apollo-lead-check').forEach(chk => {
        const idx = parseInt(chk.dataset.idx, 10);
        const lead = currentApolloLeads[idx];
        chk.checked = !!(lead && lead.complianceAllowed);
      });
      updateSelectedCount();
    }

    function updateSelectedCount() {
      const allChecks = document.querySelectorAll('.apollo-lead-check');
      const checkedBoxes = Array.from(allChecks).filter(chk => chk.checked);
      const count = checkedBoxes.length;

      const countEl = document.getElementById('apolloSelectedCount');
      if (countEl) countEl.innerText = count;

      const master = document.getElementById('selectAllCheckbox');
      if (master) {
        master.checked = allChecks.length > 0 && checkedBoxes.length === allChecks.length;
      }

      const btnText = document.getElementById('btnPushCampaignText');
      if (btnText) {
        btnText.innerText = count > 0
          ? \`Push Selected (\${count}) to Campaign\`
          : 'Select All & Push to Campaign';
      }
    }

    async function pushSelectedToCampaign() {
      if (!currentApolloLeads || currentApolloLeads.length === 0) {
        showApolloAlert('No leads available to queue. Run discovery first.', 'amber');
        return;
      }

      const checkedBoxes = Array.from(document.querySelectorAll('.apollo-lead-check:checked'));
      let targetLeads = [];

      if (checkedBoxes.length > 0) {
        targetLeads = checkedBoxes.map(chk => currentApolloLeads[parseInt(chk.dataset.idx, 10)]).filter(Boolean);
      } else {
        // "Select All & Push to Campaign" shortcut: select all leads!
        toggleSelectAllLeads(true);
        targetLeads = [...currentApolloLeads];
      }

      if (targetLeads.length === 0) {
        showApolloAlert('No leads selected to push to campaign.', 'amber');
        return;
      }

      const btn = document.getElementById('btnPushCampaign');
      const originalText = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = '<i class="fa-solid fa-spinner animate-spin text-xs"></i> <span>Queuing into Campaign...</span>';

      try {
        const res = await fetch('/campaigns/queue-leads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            campaignName: 'PTT Fleet Outreach & Dispatch Sequence',
            leads: targetLeads
          })
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || data.error || 'Failed to queue campaign leads');
        }

        // Update UI status tags for queued leads
        const queuedSet = new Set((data.queued || []).map(q => q.email.toLowerCase()));
        currentApolloLeads.forEach((lead, idx) => {
          if (queuedSet.has((lead.contactEmail || '').toLowerCase())) {
            const statusCell = document.getElementById(\`apollo-lead-status-\${idx}\`);
            if (statusCell) {
              statusCell.innerHTML = \`
                <div class="flex flex-col gap-1 items-start">
                  <span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] bg-blue-50 text-blue-700 border border-blue-200 font-bold">
                    <i class="fa-solid fa-paper-plane text-[9px] mr-1"></i> IN CAMPAIGN
                  </span>
                  <span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-gray-100 text-gray-600 border border-gray-200">
                    QUEUED
                  </span>
                </div>
              \`;
            }
          }
        });

        showApolloAlert(\`✅ \${data.message}\`, 'emerald');
      } catch (err) {
        showApolloAlert(\`❌ Campaign Push Error: \${err.message}\`, 'rose');
      } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
        updateSelectedCount();
      }
    }

    function exportApolloResultsCsv() {
      if (!currentApolloLeads || currentApolloLeads.length === 0) {
        showApolloAlert('No leads available to export. Run discovery first.', 'amber');
        return;
      }

      const checkedBoxes = Array.from(document.querySelectorAll('.apollo-lead-check:checked'));
      const exportList = checkedBoxes.length > 0
        ? checkedBoxes.map(chk => currentApolloLeads[parseInt(chk.dataset.idx, 10)]).filter(Boolean)
        : currentApolloLeads;

      const headers = [
        'Company',
        'Job Role / Position',
        'Contact Name',
        'Contact Email',
        'Phone Number',
        'Company Phone',
        'Country',
        'Industry',
        'Compliance Status',
        'Compliance Reason',
        'Qualification Outcome'
      ];

      const escapeCsv = (str) => {
        if (str === null || str === undefined) return '""';
        const val = String(str).replace(/"/g, '""');
        return \`"\${val}"\`;
      };

      const rows = exportList.map(l => [
        escapeCsv(l.companyName),
        escapeCsv(l.jobTitle),
        escapeCsv(l.contactName),
        escapeCsv(l.contactEmail),
        escapeCsv(l.contactPhone),
        escapeCsv(l.companyPhone),
        escapeCsv(l.country),
        escapeCsv(l.industry),
        escapeCsv(l.complianceAllowed ? 'ALLOWED' : 'BLOCKED'),
        escapeCsv(l.complianceReason || ''),
        escapeCsv(l.qualificationOutcome || '')
      ].join(','));

      const csvContent = [headers.join(','), ...rows].join('\\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const dateStr = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = \`apollo_leads_export_\${dateStr}.csv\`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showApolloAlert(\`📥 Exported \${exportList.length} lead(s) to CSV (\${a.download})\`, 'emerald');
    }

    function showApolloAlert(msg, type) {
      const box = document.getElementById('apolloActionAlert');
      const text = document.getElementById('apolloActionAlertText');
      if (!box || !text) return;

      box.className = \`p-3 rounded-md text-xs font-medium border flex items-center justify-between \${
        type === 'emerald'
          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
          : type === 'rose'
          ? 'bg-rose-50 text-rose-800 border-rose-200'
          : 'bg-amber-50 text-amber-800 border-amber-200'
      }\`;
      text.innerText = msg;
      box.classList.remove('hidden');
    }

    function toggleApolloRole(role) {
      const textarea = document.getElementById('apolloTitles');
      const lines = textarea.value.split('\\n').map(t => t.trim()).filter(Boolean);
      const idx = lines.indexOf(role);
      if (idx >= 0) {
        lines.splice(idx, 1);
      } else {
        lines.push(role);
      }
      textarea.value = lines.join('\\n');
    }

    async function runApolloDiscovery() {
      const btn = document.getElementById('btnApolloSearch');
      btn.disabled = true;
      btn.innerHTML = '<i class="fa-solid fa-spinner animate-spin"></i> Discovering...';

      // 1. Target Markets / Countries (Select or Type)
      const checkedCountries = Array.from(document.querySelectorAll('input[name="country"]:checked')).map(el => el.value);
      const customMarketsInput = document.getElementById('apolloCustomMarkets') ? document.getElementById('apolloCustomMarkets').value : '';
      const typedCountries = customMarketsInput.split(/[,\\n]+/).map(c => c.trim()).filter(Boolean);
      const selectedCountries = Array.from(new Set([...checkedCountries, ...typedCountries]));
      if (selectedCountries.length === 0) {
        selectedCountries.push('United Arab Emirates');
      }

      // 2. Industry (Select or Type)
      const checkedIndustries = Array.from(document.querySelectorAll('input[name="industry"]:checked')).map(el => el.value);
      const customIndustriesInput = document.getElementById('apolloCustomIndustries') ? document.getElementById('apolloCustomIndustries').value : '';
      const typedIndustries = customIndustriesInput.split(/[,\\n]+/).map(i => i.trim()).filter(Boolean);
      const selectedIndustries = Array.from(new Set([...checkedIndustries, ...typedIndustries]));

      // 3. Target Roles / Positions (Select or Type)
      const titles = document.getElementById('apolloTitles').value.split('\\n').map(t => t.trim()).filter(Boolean);
      const minEmployees = parseInt(document.getElementById('apolloMinTeam').value, 10);
      const perPage = parseInt(document.getElementById('apolloPerPage').value, 10);

      try {
        const payload = {
          countries: selectedCountries,
          titles: titles.length ? titles : undefined,
          industries: selectedIndustries.length ? selectedIndustries : undefined,
          minEmployees,
          perPage
        };

        const res = await fetch('/leads/discover/apollo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const data = await res.json();
        const resultsBox = document.getElementById('apolloResultsContainer');
        const tbody = document.getElementById('apolloResultsTbody');
        const statsBox = document.getElementById('apolloResultStats');

        tbody.innerHTML = '';
        resultsBox.classList.remove('hidden');

        currentApolloLeads = data.report.leads || [];

        statsBox.innerHTML = \`
          <span class="text-emerald-700 font-semibold">\${data.report.eligibleForOutreachCount} Eligible</span> &bull;
          <span class="text-rose-700 font-semibold">\${data.report.blockedByComplianceCount} Blocked</span> &bull;
          <span class="text-gray-500">Total: \${data.report.totalDiscovered}</span>
        \`;

        if (!data.report.leads || data.report.leads.length === 0) {
          tbody.innerHTML = '<tr><td colspan="10" class="p-6 text-center text-gray-400">No leads discovered matching the selected criteria.</td></tr>';
          return;
        }

        data.report.leads.forEach((l, idx) => {
          const tr = document.createElement('tr');
          tr.id = \`apollo-lead-row-\${idx}\`;
          const complianceBadge = l.complianceAllowed
            ? '<span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">ALLOWED</span>'
            : \`<span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] bg-rose-50 text-rose-700 border border-rose-200 font-semibold">\${l.complianceReason || 'BLOCKED'}</span>\`;

          const qualificationBadge = l.qualificationOutcome === 'WARM_QUALIFIED_HAND_TO_HUMAN'
            ? '<span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] bg-blue-50 text-blue-700 border border-blue-200 font-semibold">WARM QUALIFIED</span>'
            : \`<span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-gray-100 text-gray-600 border border-gray-200">\${l.qualificationOutcome || 'PROSPECT'}</span>\`;

          tr.innerHTML = \`
            <td class="p-3 text-center">
              <input type="checkbox" class="apollo-lead-check rounded border-gray-300 text-slate-900 focus:ring-0" data-idx="\${idx}" onchange="updateSelectedCount()">
            </td>
            <td class="p-3 font-semibold text-gray-900">\${l.companyName || '—'}</td>
            <td class="p-3 text-gray-800 font-medium">\${l.jobTitle || '—'}</td>
            <td class="p-3 text-gray-900 font-medium">\${l.contactName || '—'}</td>
            <td class="p-3 font-mono text-gray-700 text-xs">\${l.contactEmail || '—'}</td>
            <td class="p-3 font-mono text-gray-600">\${l.contactPhone || '—'}</td>
            <td class="p-3 font-mono text-gray-600">\${l.companyPhone || '—'}</td>
            <td class="p-3 font-mono font-semibold text-gray-700">\${l.country || '—'}</td>
            <td class="p-3 text-gray-600">\${l.industry || '—'}</td>
            <td class="p-3" id="apollo-lead-status-\${idx}">
              <div class="flex flex-col gap-1 items-start">
                \${complianceBadge}
                \${qualificationBadge}
              </div>
            </td>
          \`;
          tbody.appendChild(tr);
        });

        // Reset select all checkbox & count
        const master = document.getElementById('selectAllCheckbox');
        if (master) master.checked = false;
        updateSelectedCount();

      } catch (err) {
        alert('Discovery error: ' + err.message);
      } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-magnifying-glass text-xs"></i> Discover &amp; Pipeline from Apollo';
      }
    }

    function loadSampleCsv() {
      document.getElementById('csvTextInput').value =
\`First Name,Last Name,Title,Company,Email,Email Status,# Employees,Country,Website
Zayd,Mansoor,Fleet Operations Manager,Gulf Logistics LLC,zayd@gulflogistics.ae,verified,55,United Arab Emirates,gulflogistics.ae
David,Mwangi,Head of Logistics,Kenya Cargo Services,david@kenyacargo.co.ke,verified,40,Kenya,kenyacargo.co.ke
Stefan,Bauer,Dispatch Director,Munich Fleet Gmbh,stefan@munichfleet.de,verified,80,Germany,munichfleet.de\`;
    }

    async function submitCsvImport() {
      const csvContent = document.getElementById('csvTextInput').value.trim();
      if (!csvContent) {
        alert('Please paste CSV content first.');
        return;
      }

      const btn = document.getElementById('btnSubmitCsv');
      btn.disabled = true;
      btn.innerHTML = '<i class="fa-solid fa-spinner animate-spin"></i> Importing...';

      try {
        const res = await fetch('/leads/import/apollo-csv', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ csvContent })
        });
        const data = await res.json();
        const box = document.getElementById('csvResultBox');
        box.classList.remove('hidden');
        box.innerHTML = \`
          <h4 class="font-bold text-gray-900 text-xs mb-1">CSV Processed Successfully</h4>
          <p class="text-gray-600">Total Rows: <b>\${data.result.totalRows}</b> | Contacts Ingested: <b>\${data.result.importedContacts}</b> | Companies: <b>\${data.result.importedCompanies}</b></p>
          <p class="mt-1"><span class="text-emerald-700 font-semibold">\${data.result.eligibleCount} Eligible for Outreach</span> | <span class="text-rose-700 font-semibold">\${data.result.blockedCount} Blocked by Compliance</span></p>
        \`;
      } catch (err) {
        alert('CSV Import error: ' + err.message);
      } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-cloud-arrow-up text-xs"></i> Import & Process CSV';
      }
    }

    function fillSimulator(text) {
      document.getElementById('simReplyText').value = text;
    }

    async function runSimulation() {
      const btn = document.getElementById('btnRunSim');
      btn.disabled = true;
      btn.innerHTML = '<i class="fa-solid fa-spinner animate-spin"></i> Processing...';

      const payload = {
        companyName: document.getElementById('simCompany').value,
        country: document.getElementById('simCountry').value,
        contactEmail: document.getElementById('simEmail').value,
        teamSize: parseInt(document.getElementById('simTeamSize').value, 10),
        replyText: document.getElementById('simReplyText').value
      };

      try {
        const res = await fetch('/internal/simulate-reply', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const data = await res.json();

        document.getElementById('simEmptyNotice').classList.add('hidden');
        document.getElementById('simResultsContent').classList.remove('hidden');

        const badge = document.getElementById('simBadge');
        if (data.replyClassification.replyType === 4) {
          badge.className = "text-xs px-2.5 py-0.5 rounded font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200";
          badge.innerText = "Type 4: Demo Handover";
        } else if (data.replyClassification.replyType === 5) {
          badge.className = "text-xs px-2.5 py-0.5 rounded font-bold uppercase bg-amber-50 text-amber-700 border border-amber-200";
          badge.innerText = "Type 5: Pricing Escalation";
        } else if (data.replyClassification.replyType === 1) {
          badge.className = "text-xs px-2.5 py-0.5 rounded font-bold uppercase bg-rose-50 text-rose-700 border border-rose-200";
          badge.innerText = "Type 1: Auto-Suppressed";
        } else {
          badge.className = "text-xs px-2.5 py-0.5 rounded font-bold uppercase bg-blue-50 text-blue-700 border border-blue-200";
          badge.innerText = \`Type \${data.replyClassification.replyType}: \${data.replyClassification.intentName}\`;
        }

        document.getElementById('simCategory').innerText = data.replyClassification.intentName;
        document.getElementById('simSla').innerText = data.replyClassification.responseTargetHours > 0
          ? \`Within \${data.replyClassification.responseTargetHours} Hour(s)\`
          : 'Immediate Automatic Action';

        const keywordsBox = document.getElementById('simKeywords');
        if (data.replyClassification.guardrailKeywordHit) {
          keywordsBox.innerText = \`Triggered: [\${data.replyClassification.matchedKeywords.join(', ')}]\`;
          keywordsBox.className = "font-mono text-rose-700 font-semibold";
        } else {
          keywordsBox.innerText = 'No keyword trigger hit &bull; Model Intent Classification';
          keywordsBox.className = "font-mono text-gray-600 font-medium";
        }

        document.getElementById('simHoldingReply').innerText = data.replyClassification.draftHoldingReply || '(No holding reply permitted for this category)';
        document.getElementById('simHandoverPackPreview').innerText = data.handoverDescription || '(No Handover Pack generated; contact auto-suppressed)';

      } catch (err) {
        alert('Simulation error: ' + err.message);
      } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-play text-xs"></i> Execute Reply & Classification Test';
      }
    }

    async function loadHandovers() {
      try {
        const res = await fetch('/internal/handovers');
        if (res.ok) {
          const data = await res.json();
          const tbody = document.getElementById('handoversTbody');
          if (!data.leads || data.leads.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="p-6 text-center text-gray-400">No leads handed over yet in this session.</td></tr>';
            return;
          }
          tbody.innerHTML = '';
          data.leads.forEach(l => {
            const tr = document.createElement('tr');
            tr.innerHTML = \`
              <td class="p-3 font-mono font-bold text-gray-900">#\${l.id}</td>
              <td class="p-3 font-semibold text-gray-900">\${l.partner_name}</td>
              <td class="p-3 text-gray-600">\${l.contact_name} (\${l.email_from})</td>
              <td class="p-3"><span class="px-2 py-0.5 rounded bg-rose-50 text-rose-700 font-bold border border-rose-200">High Priority</span></td>
              <td class="p-3 text-emerald-700 font-semibold">Synced to Odoo</td>
              <td class="p-3 text-gray-500">\${new Date(l.updatedAt).toLocaleTimeString()}</td>
            \`;
            tbody.appendChild(tr);
          });
        }
      } catch (err) {
        console.error('Failed to load handovers', err);
      }
    }

    async function loadAutomationSettings() {
      try {
        const res = await fetch('/internal/automation/settings');
        if (res.ok) {
          const data = await res.json();
          if (data.settings) {
            const s = data.settings;
            if (s.schedule) {
              if (s.schedule.sendStart) document.getElementById('autoSendStart').value = s.schedule.sendStart;
              if (s.schedule.sendEnd) document.getElementById('autoSendEnd').value = s.schedule.sendEnd;
              if (s.schedule.timezone) document.getElementById('autoTimezone').value = s.schedule.timezone;
              if (s.schedule.maxPerDay) document.getElementById('autoMaxPerDay').value = s.schedule.maxPerDay;
              if (Array.isArray(s.schedule.sendDays)) {
                document.querySelectorAll('input[name="autoDay"]').forEach(chk => {
                  chk.checked = s.schedule.sendDays.includes(chk.value);
                });
              }
            }
            if (s.cadence) {
              if (s.cadence.followupDelayDays) document.getElementById('autoFollowupDelay').value = s.cadence.followupDelayDays;
              if (s.cadence.maxSequenceSteps) document.getElementById('autoMaxSteps').value = s.cadence.maxSequenceSteps;
              if (s.cadence.batchIntervalMinutes) document.getElementById('autoBatchInterval').value = s.cadence.batchIntervalMinutes;
            }
            if (s.retry) {
              if (s.retry.maxRetries !== undefined) document.getElementById('autoMaxRetries').value = s.retry.maxRetries;
              if (s.retry.retryBackoffSeconds) document.getElementById('autoRetryBackoff').value = s.retry.retryBackoffSeconds;
              if (s.retry.onBounceAction) document.getElementById('autoOnBounce').value = s.retry.onBounceAction;
            }
            if (s.classification) {
              if (s.classification.confidenceThreshold) document.getElementById('autoConfidenceThreshold').value = s.classification.confidenceThreshold;
              if (s.classification.qaMode) document.getElementById('autoQaMode').value = s.classification.qaMode;
            }
          }

          if (data.stats) {
            updateWorkerStatsUi(data.stats, data.settings);
          }
        }
      } catch (err) {
        console.error('Failed to load automation settings', err);
      }
    }

    function updateWorkerStatsUi(stats, settings) {
      if (!stats) return;

      const windowBadge = document.getElementById('workerWindowBadge');
      const windowText = document.getElementById('workerWindowText');
      const windowDetail = document.getElementById('workerWindowDetail');

      if (stats.windowOpen) {
        windowBadge.className = 'flex items-center gap-1.5 font-bold text-emerald-700';
        windowBadge.innerHTML = '<span class="w-2 h-2 rounded-full bg-emerald-500"></span> <span>OPEN (Active)</span>';
        windowDetail.innerText = \`\${stats.currentDayInTz} \${stats.currentTimeInTz} (\${settings?.schedule?.timezone || 'Local'})\`;
      } else {
        windowBadge.className = 'flex items-center gap-1.5 font-bold text-amber-700';
        windowBadge.innerHTML = '<span class="w-2 h-2 rounded-full bg-amber-500"></span> <span>CLOSED (Window Inactive)</span>';
        windowDetail.innerText = stats.windowReason || \`\${stats.currentDayInTz} \${stats.currentTimeInTz}\`;
      }

      document.getElementById('workerSentToday').innerText = stats.sentTodayCount || 0;
      document.getElementById('workerDailyCap').innerText = stats.dailyCap || 50;
      document.getElementById('workerRemainingCapacity').innerText = \`\${stats.remainingCapacityToday || 0} sends remaining today\`;

      document.getElementById('workerPendingCount').innerText = stats.pendingCount || 0;
      document.getElementById('workerRetryingCount').innerText = \`\${stats.retryingCount || 0} retrying due to backoff\`;

      const interval = settings?.cadence?.batchIntervalMinutes || 15;
      document.getElementById('workerCadenceInterval').innerText = \`Every \${interval}m\`;
    }

    async function triggerBatchNow() {
      const btn = document.getElementById('btnTriggerBatch');
      const originalText = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = '<i class="fa-solid fa-spinner animate-spin text-xs"></i> <span>Dispatching...</span>';

      const forceWindow = document.getElementById('chkForceWindow')?.checked || false;
      const alertBox = document.getElementById('workerBatchAlert');
      const alertText = document.getElementById('workerBatchAlertText');

      try {
        const res = await fetch('/internal/automation/trigger-batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ forceWindow })
        });
        const data = await res.json();

        updateWorkerStatsUi(data.stats, null);

        const reasonNote = data.result.reason ? \` <i>(\${data.result.reason})</i>\` : '';
        alertBox.className = "p-3 rounded-md text-xs font-medium border flex items-center justify-between bg-emerald-50 text-emerald-800 border-emerald-200";
        alertText.innerHTML = \`<b>Batch Executed:</b> \${data.result.sentCount} sent, \${data.result.retryingCount} retrying, \${data.result.failedCount} failed, \${data.result.skippedWindowCount} skipped (window).\${reasonNote}\`;
        alertBox.classList.remove('hidden');
      } catch (err) {
        alertBox.className = "p-3 rounded-md text-xs font-medium border flex items-center justify-between bg-rose-50 text-rose-800 border-rose-200";
        alertText.innerText = 'Failed to execute batch: ' + err.message;
        alertBox.classList.remove('hidden');
      } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
      }
    }

    async function saveAutomationSettings() {
      const statusEl = document.getElementById('autoSaveStatus');

      const settings = {
        schedule: {
          sendStart: document.getElementById('autoSendStart').value,
          sendEnd: document.getElementById('autoSendEnd').value,
          timezone: document.getElementById('autoTimezone').value,
          sendDays: Array.from(document.querySelectorAll('input[name="autoDay"]:checked')).map(el => el.value),
          maxPerDay: parseInt(document.getElementById('autoMaxPerDay').value, 10)
        },
        cadence: {
          followupDelayDays: parseInt(document.getElementById('autoFollowupDelay').value, 10),
          maxSequenceSteps: parseInt(document.getElementById('autoMaxSteps').value, 10),
          batchIntervalMinutes: parseInt(document.getElementById('autoBatchInterval').value, 10)
        },
        retry: {
          maxRetries: parseInt(document.getElementById('autoMaxRetries').value, 10),
          retryBackoffSeconds: parseInt(document.getElementById('autoRetryBackoff').value, 10),
          onBounceAction: document.getElementById('autoOnBounce').value
        },
        classification: {
          confidenceThreshold: parseInt(document.getElementById('autoConfidenceThreshold').value, 10),
          qaMode: document.getElementById('autoQaMode').value
        }
      };

      try {
        const res = await fetch('/internal/automation/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(settings)
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || data.error);

        updateWorkerStatsUi(data.stats, data.settings);

        statusEl.className = "text-xs text-emerald-600 font-semibold";
        statusEl.classList.remove('hidden');
        statusEl.innerText = '✅ ' + (data.message || 'Settings saved and worker reconfigured.');
        setTimeout(() => statusEl.classList.add('hidden'), 4000);
      } catch (err) {
        statusEl.className = "text-xs text-rose-600 font-semibold";
        statusEl.classList.remove('hidden');
        statusEl.innerText = '❌ Failed to save: ' + err.message;
        statusEl.classList.remove('hidden');
      }
    }

    function setWaPrompt(type) {
      const body = document.getElementById('wa-sim-body');
      if (type === 'pricing') {
        body.value = "Hello, what is your price per vehicle and can you send a quote?";
      } else if (type === 'demo') {
        body.value = "We have 50 delivery vans in Dubai and want to schedule a live demo next Tuesday.";
      } else if (type === 'legal') {
        body.value = "This message violates GDPR and privacy laws. I am filing a complaint with my lawyer.";
      }
    }

    async function sendSimulatedWhatsApp() {
      const btn = document.getElementById('wa-sim-btn');
      const resultBox = document.getElementById('wa-sim-result');
      const name = document.getElementById('wa-sim-name').value;
      const phone = document.getElementById('wa-sim-phone').value;
      const email = document.getElementById('wa-sim-email').value;
      const messageBody = document.getElementById('wa-sim-body').value;

      btn.disabled = true;
      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing...';

      try {
        const res = await fetch('/internal/whatsapp/simulate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ partnerName: name, phone, partnerEmail: email || undefined, messageBody })
        });
        const data = await res.json();

        resultBox.classList.remove('hidden');
        document.getElementById('wa-res-type').innerText = data.classification.intentName;
        document.getElementById('wa-res-reply').innerText = data.replySent ? ('"' + data.replySent + '"') : '(No sales reply sent — routed to Compliance/Admin)';
        document.getElementById('wa-res-crm').innerText = data.handoverTriggered ? ('Created (Odoo Lead ID: ' + (data.odooLeadId || 'Auto') + ')') : 'Not required';

        loadWhatsAppConversations();
        loadKpis();
      } catch (err) {
        alert('Simulation failed: ' + err.message);
      } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> <span>Send Inbound to AI</span>';
      }
    }

    async function loadWhatsAppConversations() {
      try {
        const res = await fetch('/internal/whatsapp/conversations');
        const data = await res.json();
        const tbody = document.getElementById('wa-conversations-tbody');
        if (!data.conversations || data.conversations.length === 0) {
          tbody.innerHTML = '<tr><td colspan="6" class="py-6 text-center text-gray-400 italic">No WhatsApp conversations recorded yet. Use the simulator or send a webhook to test.</td></tr>';
          return;
        }

        tbody.innerHTML = '';
        data.conversations.forEach(c => {
          const tr = document.createElement('tr');
          tr.className = "hover:bg-gray-50/80";
          tr.innerHTML = \`
            <td class="py-2.5 font-semibold text-gray-900">
              <div>\${c.partnerName}</div>
              <div class="text-[11px] text-gray-500 font-normal">\${c.phone}</div>
            </td>
            <td class="py-2.5 max-w-xs truncate text-gray-700">
              "\${c.messageBody}"
            </td>
            <td class="py-2.5">
              <span class="px-2 py-0.5 rounded text-[10px] font-bold \${c.classification.guardrailKeywordHit ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}">
                \${c.classification.intentName}
              </span>
            </td>
            <td class="py-2.5 text-[11px] text-emerald-800 italic max-w-xs truncate">
              \${c.replySent ? c.replySent : '<span class="text-gray-400 font-normal">None (Escalated/Suppressed)</span>'}
            </td>
            <td class="py-2.5">
              <span class="px-2 py-0.5 rounded text-[10px] font-semibold \${c.withinMetaWindow ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}">
                \${c.withinMetaWindow ? 'Open (<24h)' : 'Expired'}
              </span>
            </td>
            <td class="py-2.5 font-semibold">
              \${c.odooLeadId ? ('<span class="text-emerald-700">Lead #' + c.odooLeadId + '</span>') : '<span class="text-gray-400 text-[11px] font-normal">None</span>'}
            </td>
          \`;
          tbody.appendChild(tr);
        });
      } catch (err) {
        console.error('Failed to load WhatsApp conversations:', err);
      }
    }

    // Initialize on load
    loadKpis();
    loadAutomationSettings();
    loadWhatsAppConversations();
  </script>
</body>
</html>`;
}
