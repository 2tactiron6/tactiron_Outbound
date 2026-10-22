/**
 * Operations & Technical Console UI
 * Single-Page Web Interface served at /console
 */

export function getConsoleHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tactiron Outbound Ops Console</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
    body { font-family: 'Inter', sans-serif; }
    code, pre { font-family: 'JetBrains Mono', monospace; }
  </style>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen flex flex-col antialiased">

  <!-- Top Navigation Bar -->
  <header class="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between sticky top-0 z-50 shadow-md">
    <div class="flex items-center space-x-4">
      <div class="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-lg">
        <i class="fa-solid fa-satellite-dish"></i>
      </div>
      <div>
        <div class="flex items-center space-x-2">
          <h1 class="font-bold text-lg text-white tracking-tight">Tactiron Outbound</h1>
          <span class="text-xs px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 font-medium">Ops & Tech Console</span>
          <span id="systemStatusBadge" class="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-medium flex items-center gap-1">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> SYSTEM ACTIVE
          </span>
        </div>
        <p class="text-xs text-slate-400">Push-to-Talk Platform Outbound Engine &bull; Sales UI: <span class="text-amber-400 font-medium">Odoo CRM</span></p>
      </div>
    </div>

    <!-- Emergency Kill Switch & Review Mode -->
    <div class="flex items-center space-x-4">
      <div class="flex items-center space-x-2 bg-slate-800/80 border border-slate-700/80 px-3 py-1.5 rounded-lg text-xs">
        <span class="text-slate-400">Review Mode:</span>
        <span class="text-sky-400 font-semibold uppercase">Month 1 (100% QA)</span>
      </div>

      <button id="killSwitchBtn" onclick="toggleKillSwitch()" class="px-4 py-2 rounded-lg font-semibold text-xs tracking-wider uppercase transition-all duration-200 flex items-center gap-2 bg-rose-600/20 text-rose-300 border border-rose-500/40 hover:bg-rose-600/30 shadow-sm">
        <i class="fa-solid fa-power-off"></i>
        <span id="killSwitchText">Emergency Kill Switch</span>
      </button>
    </div>
  </header>

  <!-- Main Layout with Tabs -->
  <div class="flex-1 flex overflow-hidden">
    <!-- Sidebar Navigation -->
    <aside class="w-64 bg-slate-900/60 border-r border-slate-800 flex flex-col justify-between p-4">
      <nav class="space-y-1.5">
        <button onclick="switchTab('dashboard')" id="nav-dashboard" class="tab-btn w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition text-emerald-400 bg-slate-800/80 border border-slate-700">
          <i class="fa-solid fa-chart-line w-4 text-center"></i>
          <span>Overview & KPIs</span>
        </button>

        <button onclick="switchTab('apollo')" id="nav-apollo" class="tab-btn w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition text-slate-400 hover:text-slate-200 hover:bg-slate-800/40">
          <i class="fa-solid fa-magnifying-glass-chart w-4 text-center"></i>
          <span>Apollo Lead Discovery</span>
        </button>

        <button onclick="switchTab('csv-import')" id="nav-csv-import" class="tab-btn w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition text-slate-400 hover:text-slate-200 hover:bg-slate-800/40">
          <i class="fa-solid fa-file-csv w-4 text-center"></i>
          <span>Apollo CSV Import</span>
        </button>

        <button onclick="switchTab('simulator')" id="nav-simulator" class="tab-btn w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition text-slate-400 hover:text-slate-200 hover:bg-slate-800/40">
          <i class="fa-solid fa-flask-vial w-4 text-center"></i>
          <span>Reply & Guardrail Lab</span>
        </button>

        <button onclick="switchTab('handovers')" id="nav-handovers" class="tab-btn w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition text-slate-400 hover:text-slate-200 hover:bg-slate-800/40">
          <i class="fa-solid fa-handshake-angle w-4 text-center"></i>
          <span>Odoo Handovers</span>
        </button>

        <button onclick="switchTab('compliance')" id="nav-compliance" class="tab-btn w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition text-slate-400 hover:text-slate-200 hover:bg-slate-800/40">
          <i class="fa-solid fa-scale-balanced w-4 text-center"></i>
          <span>Compliance Policies</span>
        </button>
      </nav>

      <div class="bg-slate-900 border border-slate-800 rounded-lg p-3 text-xs space-y-2">
        <div class="flex items-center justify-between text-slate-400">
          <span>Odoo Sync:</span>
          <span class="text-emerald-400 font-medium">Connected</span>
        </div>
        <div class="flex items-center justify-between text-slate-400">
          <span>Smartlead:</span>
          <span class="text-emerald-400 font-medium">Ready</span>
        </div>
        <div class="flex items-center justify-between text-slate-400">
          <span>Model:</span>
          <span class="text-sky-400 font-medium">Claude 3.5 Sonnet</span>
        </div>
      </div>
    </aside>

    <!-- Tab Content Area -->
    <main class="flex-1 overflow-y-auto p-8 space-y-8 bg-slate-950">

      <!-- ================= TAB 1: OVERVIEW & KPIS ================= -->
      <section id="tab-dashboard" class="space-y-6">
        <div>
          <h2 class="text-2xl font-bold text-white tracking-tight">System Performance & Control Overview</h2>
          <p class="text-sm text-slate-400">Authoritative audit metrics, compliance pass rates, and human handover SLAs.</p>
        </div>

        <!-- Metric Cards Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-sm">
            <div class="flex items-center justify-between text-slate-400 text-xs font-medium uppercase tracking-wider">
              <span>Leads Handed Over</span>
              <i class="fa-solid fa-hand-holding-dollar text-emerald-400"></i>
            </div>
            <div class="mt-2 flex items-baseline gap-2">
              <span id="metric-handovers" class="text-3xl font-extrabold text-white">0</span>
              <span class="text-xs text-emerald-400 font-medium">Warm to Sales</span>
            </div>
            <p class="mt-2 text-xs text-slate-500">Transferred to Odoo CRM with full pack</p>
          </div>

          <div class="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-sm">
            <div class="flex items-center justify-between text-slate-400 text-xs font-medium uppercase tracking-wider">
              <span>Missed Escalations</span>
              <i class="fa-solid fa-triangle-exclamation text-rose-400"></i>
            </div>
            <div class="mt-2 flex items-baseline gap-2">
              <span id="metric-missed" class="text-3xl font-extrabold text-white">0</span>
              <span class="text-xs text-emerald-400 font-medium">On Target (0)</span>
            </div>
            <p class="mt-2 text-xs text-slate-500">Target is 0; any non-zero triggers review</p>
          </div>

          <div class="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-sm">
            <div class="flex items-center justify-between text-slate-400 text-xs font-medium uppercase tracking-wider">
              <span>Outreach Permitted</span>
              <i class="fa-solid fa-shield-halved text-sky-400"></i>
            </div>
            <div class="mt-2 flex items-baseline gap-2">
              <span id="metric-permitted" class="text-3xl font-extrabold text-white">100%</span>
              <span class="text-xs text-sky-400 font-medium">Compliance Pass</span>
            </div>
            <p class="mt-2 text-xs text-slate-500">Verified lawful basis & permitted country</p>
          </div>

          <div class="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-sm">
            <div class="flex items-center justify-between text-slate-400 text-xs font-medium uppercase tracking-wider">
              <span>Min Team Size</span>
              <i class="fa-solid fa-users text-amber-400"></i>
            </div>
            <div class="mt-2 flex items-baseline gap-2">
              <span id="metric-teamsize" class="text-3xl font-extrabold text-white">20+</span>
              <span class="text-xs text-amber-400 font-medium">Employees</span>
            </div>
            <p class="mt-2 text-xs text-slate-500">Excel qualification threshold</p>
          </div>
        </div>

        <!-- SLA Response Targets -->
        <div class="bg-slate-900/60 border border-slate-800 rounded-xl p-6 space-y-4">
          <h3 class="text-base font-semibold text-white flex items-center gap-2">
            <i class="fa-solid fa-stopwatch text-emerald-400"></i> Response Target SLAs (Defined in Handover Rules)
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="border border-slate-800 bg-slate-900 p-4 rounded-lg">
              <div class="flex items-center justify-between">
                <span class="text-xs font-semibold text-rose-400 uppercase tracking-wide">Urgent Priority</span>
                <span class="text-xs bg-rose-500/10 text-rose-400 px-2 py-0.5 rounded border border-rose-500/20">&lt; 1 Hour</span>
              </div>
              <h4 class="mt-2 font-bold text-white text-sm">Demo / Meeting Requests</h4>
              <p class="mt-1 text-xs text-slate-400">Highest-priority commercial opportunity. Rep must call within 1 hour.</p>
            </div>

            <div class="border border-slate-800 bg-slate-900 p-4 rounded-lg">
              <div class="flex items-center justify-between">
                <span class="text-xs font-semibold text-amber-400 uppercase tracking-wide">Standard Priority</span>
                <span class="text-xs bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded border border-amber-500/20">&lt; 4 Hours</span>
              </div>
              <h4 class="mt-2 font-bold text-white text-sm">Pricing, Contracts & Partners</h4>
              <p class="mt-1 text-xs text-slate-400">AI sends one approved holding reply. Human sales prepares quote.</p>
            </div>

            <div class="border border-slate-800 bg-slate-900 p-4 rounded-lg">
              <div class="flex items-center justify-between">
                <span class="text-xs font-semibold text-purple-400 uppercase tracking-wide">Compliance Route</span>
                <span class="text-xs bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded border border-purple-500/20">&lt; 1 Business Day</span>
              </div>
              <h4 class="mt-2 font-bold text-white text-sm">Legal, GDPR & Complaints</h4>
              <p class="mt-1 text-xs text-slate-400">Direct escalation to Compliance Officer. No marketing reply sent.</p>
            </div>
          </div>
        </div>
      </section>

      <!-- ================= TAB 2: APOLLO LEAD DISCOVERY ================= -->
      <section id="tab-apollo" class="space-y-6 hidden">
        <div>
          <h2 class="text-2xl font-bold text-white tracking-tight">Apollo ICP Lead Discovery</h2>
          <p class="text-sm text-slate-400">Query Apollo.io by target push-to-talk fleet criteria, normalize, and pipeline into compliance.</p>
        </div>

        <!-- Search Filters Form -->
        <div class="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <!-- Target Markets -->
            <div class="space-y-2">
              <label class="block text-xs font-medium uppercase tracking-wider text-slate-300">Target Markets / Countries</label>
              <div class="space-y-2 text-sm text-slate-300">
                <label class="flex items-center space-x-2">
                  <input type="checkbox" name="country" value="United Arab Emirates" checked class="rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-0">
                  <span>United Arab Emirates (GCC)</span>
                </label>
                <label class="flex items-center space-x-2">
                  <input type="checkbox" name="country" value="Saudi Arabia" checked class="rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-0">
                  <span>Saudi Arabia (GCC)</span>
                </label>
                <label class="flex items-center space-x-2">
                  <input type="checkbox" name="country" value="Kenya" checked class="rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-0">
                  <span>Kenya (East Africa)</span>
                </label>
                <label class="flex items-center space-x-2">
                  <input type="checkbox" name="country" value="Germany" class="rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-0">
                  <span>Germany (Strict Opt-in Test)</span>
                </label>
              </div>
            </div>

            <!-- Target Decision Maker Titles -->
            <div class="space-y-2">
              <label class="block text-xs font-medium uppercase tracking-wider text-slate-300">Target Roles (Fleet / Dispatch / Ops)</label>
              <textarea id="apolloTitles" rows="4" class="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 focus:ring-1 focus:ring-emerald-500 focus:outline-none font-mono">Operations Director
Fleet Manager
Dispatch Manager
Head of Logistics
Transport Manager</textarea>
              <span class="text-[11px] text-slate-500">One role per line</span>
            </div>

            <!-- Team Size & Volume -->
            <div class="space-y-4">
              <div>
                <label class="block text-xs font-medium uppercase tracking-wider text-slate-300">Minimum Fleet / Team Size</label>
                <input type="number" id="apolloMinTeam" value="20" class="mt-1 w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-slate-200 focus:ring-1 focus:ring-emerald-500 focus:outline-none">
                <span class="text-[11px] text-slate-500">Excel qualification threshold is 20+</span>
              </div>
              <div>
                <label class="block text-xs font-medium uppercase tracking-wider text-slate-300">Batch Per Page</label>
                <input type="number" id="apolloPerPage" value="10" max="50" class="mt-1 w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-slate-200 focus:ring-1 focus:ring-emerald-500 focus:outline-none">
              </div>
            </div>
          </div>

          <div class="pt-4 border-t border-slate-800 flex items-center justify-between">
            <span class="text-xs text-slate-400">Leads will be normalized and passed through the Compliance Router automatically.</span>
            <button onclick="runApolloDiscovery()" id="btnApolloSearch" class="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-lg transition-all flex items-center gap-2 shadow-sm">
              <i class="fa-solid fa-bolt"></i>
              <span>Discover & Pipeline from Apollo</span>
            </button>
          </div>
        </div>

        <!-- Discovery Results -->
        <div id="apolloResultsContainer" class="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4 hidden">
          <div class="flex items-center justify-between">
            <h3 class="font-bold text-white text-base">Apollo Discovery Report</h3>
            <div id="apolloResultStats" class="text-xs text-slate-300 space-x-2"></div>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs text-slate-300">
              <thead class="bg-slate-800/80 text-slate-400 uppercase tracking-wider text-[11px]">
                <tr>
                  <th class="p-3">Contact</th>
                  <th class="p-3">Company</th>
                  <th class="p-3">Country</th>
                  <th class="p-3">Team Size</th>
                  <th class="p-3">Compliance</th>
                  <th class="p-3">Qualification</th>
                </tr>
              </thead>
              <tbody id="apolloResultsTbody" class="divide-y divide-slate-800"></tbody>
            </table>
          </div>
        </div>
      </section>

      <!-- ================= TAB 3: APOLLO CSV IMPORT ================= -->
      <section id="tab-csv-import" class="space-y-6 hidden">
        <div>
          <h2 class="text-2xl font-bold text-white tracking-tight">Apollo CSV Batch Importer</h2>
          <p class="text-sm text-slate-400">Import saved searches and exported lists from your Apollo seats directly into the pipeline.</p>
        </div>

        <div class="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <div class="space-y-2">
            <label class="block text-xs font-medium uppercase tracking-wider text-slate-300">Paste Apollo Export CSV Text</label>
            <textarea id="csvTextInput" rows="8" placeholder="First Name,Last Name,Title,Company,Email,Email Status,# Employees,Country,Website..." class="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-xs text-slate-200 font-mono focus:ring-1 focus:ring-emerald-500 focus:outline-none"></textarea>
          </div>

          <div class="flex items-center justify-between">
            <button onclick="loadSampleCsv()" class="text-xs text-slate-400 hover:text-slate-200 underline">Load Sample Apollo CSV</button>
            <button onclick="submitCsvImport()" id="btnSubmitCsv" class="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-lg transition-all flex items-center gap-2">
              <i class="fa-solid fa-cloud-arrow-up"></i>
              <span>Import & Process CSV</span>
            </button>
          </div>

          <div id="csvResultBox" class="mt-4 p-4 rounded-lg bg-slate-800/80 border border-slate-700 text-xs hidden"></div>
        </div>
      </section>

      <!-- ================= TAB 4: SIMULATOR & GUARDRAIL LAB ================= -->
      <section id="tab-simulator" class="space-y-6 hidden">
        <div>
          <h2 class="text-2xl font-bold text-white tracking-tight">Inbound Reply & Guardrail Testing Lab</h2>
          <p class="text-sm text-slate-400">Test how prospect responses are classified, scan for the 7 Excel guardrail keywords, and view the Odoo Handover Pack.</p>
        </div>

        <!-- Quick Sample Test Buttons -->
        <div class="space-y-2">
          <span class="text-xs uppercase font-medium tracking-wider text-slate-400">Preset Scenario Quick-Fill:</span>
          <div class="flex flex-wrap gap-2">
            <button onclick="fillSimulator('Hi, we have 45 fleet vehicles in Dubai. Can you schedule a demo tomorrow at 2 PM?')" class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-emerald-400 rounded-md text-xs font-medium">
              Demo Request (1h SLA)
            </button>
            <button onclick="fillSimulator('Please send me a quote and pricing sheet for 50 handheld devices.')" class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-400 rounded-md text-xs font-medium">
              Pricing Keyword Guardrail (4h SLA)
            </button>
            <button onclick="fillSimulator('We are a telecom reseller in Nairobi interested in distributor margins.')" class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-sky-400 rounded-md text-xs font-medium">
              Partner Inquiry (4h SLA)
            </button>
            <button onclick="fillSimulator('This email violates GDPR. My lawyer will contact your company.')" class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-purple-400 rounded-md text-xs font-medium">
              Legal/GDPR Escalation (24h SLA)
            </button>
            <button onclick="fillSimulator('Please remove me from your list. Unsubscribe immediately.')" class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-rose-400 rounded-md text-xs font-medium">
              Opt-Out / Unsubscribe (Auto Suppress)
            </button>
          </div>
        </div>

        <!-- Simulator Form -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div class="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
            <h3 class="text-sm font-semibold text-white uppercase tracking-wider">Simulated Prospect Details</h3>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs text-slate-400">Company Name</label>
                <input id="simCompany" value="Gulf Logistics Fleet LLC" class="mt-1 w-full bg-slate-800 border border-slate-700 rounded p-2 text-xs text-white">
              </div>
              <div>
                <label class="block text-xs text-slate-400">Country</label>
                <select id="simCountry" class="mt-1 w-full bg-slate-800 border border-slate-700 rounded p-2 text-xs text-white">
                  <option value="AE">UAE (GCC)</option>
                  <option value="SA">Saudi Arabia (GCC)</option>
                  <option value="KE">Kenya (Africa)</option>
                  <option value="DE">Germany (Europe)</option>
                </select>
              </div>
              <div>
                <label class="block text-xs text-slate-400">Contact Email</label>
                <input id="simEmail" value="operations@gulflogistics.ae" class="mt-1 w-full bg-slate-800 border border-slate-700 rounded p-2 text-xs text-white">
              </div>
              <div>
                <label class="block text-xs text-slate-400">Team Size</label>
                <input id="simTeamSize" type="number" value="45" class="mt-1 w-full bg-slate-800 border border-slate-700 rounded p-2 text-xs text-white">
              </div>
            </div>

            <div class="space-y-2">
              <label class="block text-xs text-slate-400 font-medium">Inbound Reply Text</label>
              <textarea id="simReplyText" rows="4" class="w-full bg-slate-800 border border-slate-700 rounded p-3 text-xs text-white font-mono focus:ring-1 focus:ring-emerald-500 focus:outline-none">Can we get a demo tomorrow at 2 PM for our 45 drivers?</textarea>
            </div>

            <button onclick="runSimulation()" id="btnRunSim" class="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-lg transition-all flex items-center justify-center gap-2">
              <i class="fa-solid fa-play"></i>
              <span>Execute Reply & Classification Test</span>
            </button>
          </div>

          <!-- Simulator Analysis Output -->
          <div id="simOutputBox" class="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
            <h3 class="text-sm font-semibold text-white uppercase tracking-wider flex items-center justify-between">
              <span>Classification & Guardrail Results</span>
              <span id="simBadge" class="text-xs px-2 py-0.5 rounded font-bold uppercase bg-slate-800 text-slate-400">Ready</span>
            </h3>

            <div id="simEmptyNotice" class="text-center py-12 text-slate-500 text-xs">
              Click "Execute Reply & Classification Test" to inspect decisions.
            </div>

            <div id="simResultsContent" class="space-y-4 hidden text-xs">
              <div class="grid grid-cols-2 gap-3">
                <div class="p-3 bg-slate-800/80 rounded border border-slate-700">
                  <span class="text-slate-400 block text-[11px]">Reply Category:</span>
                  <span id="simCategory" class="font-bold text-white text-sm"></span>
                </div>
                <div class="p-3 bg-slate-800/80 rounded border border-slate-700">
                  <span class="text-slate-400 block text-[11px]">SLA Response Target:</span>
                  <span id="simSla" class="font-bold text-emerald-400 text-sm"></span>
                </div>
              </div>

              <div class="p-3 bg-slate-800/80 rounded border border-slate-700 space-y-1">
                <span class="text-slate-400 block text-[11px]">Guardrail Keyword Scan:</span>
                <div id="simKeywords" class="font-mono text-amber-400 font-semibold"></div>
              </div>

              <div class="p-3 bg-slate-800/80 rounded border border-slate-700 space-y-1">
                <span class="text-slate-400 block text-[11px]">Approved Holding Reply (If dispatched):</span>
                <p id="simHoldingReply" class="text-slate-300 italic"></p>
              </div>

              <div class="space-y-1">
                <span class="text-slate-400 block text-[11px]">Generated Odoo Handover Pack (Preview):</span>
                <pre id="simHandoverPackPreview" class="p-3 bg-slate-950 border border-slate-800 rounded text-[11px] text-slate-300 max-h-48 overflow-y-auto whitespace-pre-wrap font-mono"></pre>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ================= TAB 5: ODOO HANDOVERS ================= -->
      <section id="tab-handovers" class="space-y-6 hidden">
        <div>
          <h2 class="text-2xl font-bold text-white tracking-tight">Odoo CRM Handover Inspection</h2>
          <p class="text-sm text-slate-400">All warm leads, high-priority replies, and escalations synchronized to Odoo CRM.</p>
        </div>

        <div class="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs text-slate-300">
              <thead class="bg-slate-800 text-slate-400 uppercase tracking-wider text-[11px]">
                <tr>
                  <th class="p-3">Odoo Lead ID</th>
                  <th class="p-3">Company</th>
                  <th class="p-3">Contact</th>
                  <th class="p-3">Priority</th>
                  <th class="p-3">Status</th>
                  <th class="p-3">Handover Timestamp</th>
                </tr>
              </thead>
              <tbody id="handoversTbody" class="divide-y divide-slate-800">
                <tr>
                  <td colspan="6" class="p-6 text-center text-slate-500">No leads handed over yet in this session.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <!-- ================= TAB 6: COMPLIANCE MATRIX ================= -->
      <section id="tab-compliance" class="space-y-6 hidden">
        <div>
          <h2 class="text-2xl font-bold text-white tracking-tight">Compliance Router & Policy Matrix</h2>
          <p class="text-sm text-slate-400">Deterministic jurisdiction rules, channel allowances, and keyword triggers.</p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div class="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-3">
            <h3 class="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
              <i class="fa-solid fa-key text-amber-400"></i> Mandatory Escalation Keywords (Sheet AI Guardrails)
            </h3>
            <p class="text-xs text-slate-400">Hitting any of these triggers immediate human escalation and bypasses AI response generation:</p>
            <div class="flex flex-wrap gap-2 pt-2">
              <span class="px-2.5 py-1 bg-slate-800 border border-slate-700 text-rose-300 rounded text-xs font-mono">price</span>
              <span class="px-2.5 py-1 bg-slate-800 border border-slate-700 text-rose-300 rounded text-xs font-mono">pricing</span>
              <span class="px-2.5 py-1 bg-slate-800 border border-slate-700 text-rose-300 rounded text-xs font-mono">quote</span>
              <span class="px-2.5 py-1 bg-slate-800 border border-slate-700 text-rose-300 rounded text-xs font-mono">contract</span>
              <span class="px-2.5 py-1 bg-slate-800 border border-slate-700 text-rose-300 rounded text-xs font-mono">legal</span>
              <span class="px-2.5 py-1 bg-slate-800 border border-slate-700 text-rose-300 rounded text-xs font-mono">gdpr</span>
              <span class="px-2.5 py-1 bg-slate-800 border border-slate-700 text-rose-300 rounded text-xs font-mono">complaint</span>
              <span class="px-2.5 py-1 bg-slate-800 border border-slate-700 text-rose-300 rounded text-xs font-mono">lawyer</span>
            </div>
          </div>

          <div class="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-3">
            <h3 class="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
              <i class="fa-solid fa-earth-americas text-emerald-400"></i> Market Channel Permissions
            </h3>
            <div class="text-xs space-y-2 text-slate-300">
              <div class="flex justify-between border-b border-slate-800 pb-1.5">
                <span>UAE / Saudi Arabia / Qatar / Kuwait / Oman / Kenya:</span>
                <span class="text-emerald-400 font-semibold">Email &amp; LinkedIn Permitted</span>
              </div>
              <div class="flex justify-between border-b border-slate-800 pb-1.5">
                <span>Germany (DE):</span>
                <span class="text-amber-400 font-semibold">LinkedIn Only (Cold Email Prohibited)</span>
              </div>
              <div class="flex justify-between border-b border-slate-800 pb-1.5">
                <span>United Kingdom / France:</span>
                <span class="text-emerald-400 font-semibold">B2B Email Permitted (Legitimate Interest)</span>
              </div>
              <div class="flex justify-between">
                <span>WhatsApp Outreach:</span>
                <span class="text-rose-400 font-semibold">Strict Opt-in Only (No cross-channel hop)</span>
              </div>
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
        btn.classList.remove('text-emerald-400', 'bg-slate-800/80', 'border', 'border-slate-700');
        btn.classList.add('text-slate-400');
      });

      const activeBtn = document.getElementById('nav-' + tabId);
      if (activeBtn) {
        activeBtn.classList.remove('text-slate-400');
        activeBtn.classList.add('text-emerald-400', 'bg-slate-800/80', 'border', 'border-slate-700');
      }

      if (tabId === 'dashboard') loadKpis();
      if (tabId === 'handovers') loadHandovers();
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
        btn.className = "px-4 py-2 rounded-lg font-semibold text-xs tracking-wider uppercase bg-rose-600 text-white shadow-lg shadow-rose-600/30 animate-pulse";
        text.innerText = "KILL SWITCH ACTIVE (FROZEN)";
        statusBadge.className = "text-xs px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 font-medium flex items-center gap-1";
        statusBadge.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-rose-400"></span> ALL SENDING FROZEN';
      } else {
        btn.className = "px-4 py-2 rounded-lg font-semibold text-xs tracking-wider uppercase transition-all duration-200 flex items-center gap-2 bg-rose-600/20 text-rose-300 border border-rose-500/40 hover:bg-rose-600/30";
        text.innerText = "Emergency Kill Switch";
        statusBadge.className = "text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-medium flex items-center gap-1";
        statusBadge.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> SYSTEM ACTIVE';
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

    async function runApolloDiscovery() {
      const btn = document.getElementById('btnApolloSearch');
      btn.disabled = true;
      btn.innerHTML = '<i class="fa-solid fa-spinner animate-spin"></i> Discovering...';

      const selectedCountries = Array.from(document.querySelectorAll('input[name="country"]:checked')).map(el => el.value);
      const titles = document.getElementById('apolloTitles').value.split('\\n').map(t => t.trim()).filter(Boolean);
      const minEmployees = parseInt(document.getElementById('apolloMinTeam').value, 10);
      const perPage = parseInt(document.getElementById('apolloPerPage').value, 10);

      try {
        const res = await fetch('/leads/discover/apollo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ countries: selectedCountries, titles, minEmployees, perPage })
        });

        const data = await res.json();
        const resultsBox = document.getElementById('apolloResultsContainer');
        const tbody = document.getElementById('apolloResultsTbody');
        const statsBox = document.getElementById('apolloResultStats');

        tbody.innerHTML = '';
        resultsBox.classList.remove('hidden');

        statsBox.innerHTML = \`
          <span class="text-emerald-400 font-semibold">\${data.report.eligibleForOutreachCount} Eligible</span> &bull;
          <span class="text-rose-400 font-semibold">\${data.report.blockedByComplianceCount} Blocked</span> &bull;
          <span class="text-slate-400">Total: \${data.report.totalDiscovered}</span>
        \`;

        data.report.leads.forEach(l => {
          const tr = document.createElement('tr');
          const complianceBadge = l.complianceAllowed
            ? '<span class="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">ALLOWED</span>'
            : \`<span class="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 font-bold">\${l.complianceReason}</span>\`;

          tr.innerHTML = \`
            <td class="p-3 font-medium text-white">\${l.contactEmail}</td>
            <td class="p-3">\${l.companyName}</td>
            <td class="p-3 font-mono font-semibold">\${l.country}</td>
            <td class="p-3">\${l.teamSize || 'Unknown'}</td>
            <td class="p-3">\${complianceBadge}</td>
            <td class="p-3 text-slate-400">\${l.qualificationOutcome}</td>
          \`;
          tbody.appendChild(tr);
        });

      } catch (err) {
        alert('Discovery error: ' + err.message);
      } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-bolt"></i> Discover & Pipeline from Apollo';
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
          <h4 class="font-bold text-emerald-400 text-sm mb-2">CSV Processed Successfully</h4>
          <p>Total Rows: <b>\${data.result.totalRows}</b> | Contacts Ingested: <b>\${data.result.importedContacts}</b> | Companies: <b>\${data.result.importedCompanies}</b></p>
          <p class="mt-1"><span class="text-emerald-400 font-semibold">\${data.result.eligibleCount} Eligible for Outreach</span> | <span class="text-rose-400 font-semibold">\${data.result.blockedCount} Blocked by Compliance</span></p>
        \`;
      } catch (err) {
        alert('CSV Import error: ' + err.message);
      } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> Import & Process CSV';
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
          badge.className = "text-xs px-2 py-0.5 rounded font-bold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30";
          badge.innerText = "Type 4: Demo Handover";
        } else if (data.replyClassification.replyType === 5) {
          badge.className = "text-xs px-2 py-0.5 rounded font-bold uppercase bg-amber-500/20 text-amber-400 border border-amber-500/30";
          badge.innerText = "Type 5: Pricing Escalation";
        } else if (data.replyClassification.replyType === 1) {
          badge.className = "text-xs px-2 py-0.5 rounded font-bold uppercase bg-rose-500/20 text-rose-400 border border-rose-500/30";
          badge.innerText = "Type 1: Auto-Suppressed";
        } else {
          badge.className = "text-xs px-2 py-0.5 rounded font-bold uppercase bg-sky-500/20 text-sky-400 border border-sky-500/30";
          badge.innerText = \`Type \${data.replyClassification.replyType}: \${data.replyClassification.intentName}\`;
        }

        document.getElementById('simCategory').innerText = data.replyClassification.intentName;
        document.getElementById('simSla').innerText = data.replyClassification.responseTargetHours > 0
          ? \`Within \${data.replyClassification.responseTargetHours} Hour(s)\`
          : 'Immediate Automatic Action';

        const keywordsBox = document.getElementById('simKeywords');
        if (data.replyClassification.guardrailKeywordHit) {
          keywordsBox.innerText = \`Triggered: [\${data.replyClassification.matchedKeywords.join(', ')}]\`;
          keywordsBox.className = "font-mono text-rose-400 font-semibold";
        } else {
          keywordsBox.innerText = 'No keyword trigger hit &bull; Model Intent Classification';
          keywordsBox.className = "font-mono text-slate-400 font-medium";
        }

        document.getElementById('simHoldingReply').innerText = data.replyClassification.draftHoldingReply || '(No holding reply permitted for this category)';
        document.getElementById('simHandoverPackPreview').innerText = data.handoverDescription || '(No Handover Pack generated; contact auto-suppressed)';

      } catch (err) {
        alert('Simulation error: ' + err.message);
      } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-play"></i> Execute Reply & Classification Test';
      }
    }

    async function loadHandovers() {
      try {
        const res = await fetch('/internal/handovers');
        if (res.ok) {
          const data = await res.json();
          const tbody = document.getElementById('handoversTbody');
          if (!data.leads || data.leads.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="p-6 text-center text-slate-500">No leads handed over yet in this session.</td></tr>';
            return;
          }
          tbody.innerHTML = '';
          data.leads.forEach(l => {
            const tr = document.createElement('tr');
            tr.innerHTML = \`
              <td class="p-3 font-mono font-bold text-emerald-400">#\${l.id}</td>
              <td class="p-3 font-medium text-white">\${l.partner_name}</td>
              <td class="p-3">\${l.contact_name} (\${l.email_from})</td>
              <td class="p-3"><span class="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 font-bold border border-rose-500/20">High Priority</span></td>
              <td class="p-3 text-emerald-400 font-medium">Synchronized to Odoo</td>
              <td class="p-3 text-slate-400">\${new Date(l.updatedAt).toLocaleTimeString()}</td>
            \`;
            tbody.appendChild(tr);
          });
        }
      } catch (err) {
        console.error('Failed to load handovers', err);
      }
    }

    // Initialize on load
    loadKpis();
  </script>
</body>
</html>`;
}
