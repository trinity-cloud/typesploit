/**
 * RPC method names for Metasploit.
 */
//
// Authentication
export const AuthLogin                  = 'auth.login';
export const AuthLogout                 = 'auth.logout';
export const AuthTokenList              = 'auth.token_list';
export const AuthTokenAdd               = 'auth.token_add';
export const AuthTokenGenerate          = 'auth.token_generate';
export const AuthTokenRemove            = 'auth.token_remove';

//
// Console
export const ConsoleCreate              = 'console.create';
export const ConsoleList                = 'console.list';
export const ConsoleDestroy             = 'console.destroy';
export const ConsoleRead                = 'console.read';
export const ConsoleWrite               = 'console.write';
export const ConsoleTabs                = 'console.tabs';
export const ConsoleSessionKill         = 'console.session_kill';
export const ConsoleSessionDetach       = 'console.session_detach';

//
// Core
export const CoreVersion                = 'core.version';
export const CoreStop                   = 'core.stop';
export const CoreSetG                   = 'core.setg';
export const CoreUnsetG                 = 'core.unsetg';
export const CoreSave                   = 'core.save';
export const CoreReloadModules          = 'core.reload_modules';
export const CoreModuleStats            = 'core.module_stats';
export const CoreAddModulePath          = 'core.add_module_path';
export const CoreThreadList             = 'core.thread_list';
export const CoreThreadKill             = 'core.thread_kill';

//
// Database (db.*)
export const DbHosts                    = 'db.hosts';
export const DbServices                 = 'db.services';
export const DbVulns                    = 'db.vulns';
export const DbWorkspaces               = 'db.workspaces';
export const DbCurrentWorkspace         = 'db.current_workspace';
export const DbGetWorkspace             = 'db.get_workspace';
export const DbSetWorkspace             = 'db.set_workspace';
export const DbDelWorkspace             = 'db.del_workspace';
export const DbAddWorkspace             = 'db.add_workspace';
export const DbGetHost                  = 'db.get_host';
export const DbReportHost               = 'db.report_host';
export const DbDelHost                  = 'db.del_host';
export const DbGetService               = 'db.get_service';
export const DbReportService            = 'db.report_service';
export const DbDelService               = 'db.del_service';
export const DbNotes                    = 'db.notes';
export const DbGetNote                  = 'db.get_note';
export const DbReportNote               = 'db.report_note';
export const DbDelNote                  = 'db.del_note';
export const DbCreds                    = 'db.creds';
export const DbReportCred               = 'db.report_cred';
export const DbDelClient                = 'db.del_client';
export const DbClients                  = 'db.clients';
export const DbReportClient             = 'db.report_client';
export const DbReportVuln               = 'db.report_vuln';
export const DbDelVuln                  = 'db.del_vuln';
export const DbEvents                   = 'db.events';
export const DbReportEvent              = 'db.report_event';
export const DbLoots                    = 'db.loots';
export const DbReportLoot               = 'db.report_loot';
export const DbImportData               = 'db.import_data';
export const DbGetVuln                  = 'db.get_vuln';
export const DbGetRef                   = 'db.get_ref';
export const DbDriver                   = 'db.driver';
export const DbConnect                  = 'db.connect';
export const DbStatus                   = 'db.status';
export const DbDisconnect               = 'db.disconnect';

//
// Jobs
export const JobList                    = 'job.list';
export const JobStop                    = 'job.stop';
export const JobInfo                    = 'job.info';

//
// Modules (module.*)
export const ModuleExploits             = 'module.exploits';
export const ModuleEvasion              = 'module.evasion';
export const ModuleAuxiliary            = 'module.auxiliary';
export const ModulePayloads             = 'module.payloads';
export const ModuleEncoders             = 'module.encoders';
export const ModuleNops                 = 'module.nops';
export const ModulePlatforms            = 'module.platforms';
export const ModulePost                 = 'module.post';
export const ModuleInfo                 = 'module.info';
export const ModuleInfoHTML             = 'module.info_html';
export const ModuleOptions              = 'module.options';
export const ModuleCompatiblePayloads   = 'module.compatible_payloads';
export const ModuleCompatibleEvasionPayloads = 'module.compatible_evasion_payloads';
export const ModuleCompatibleSessions   = 'module.compatible_sessions';
export const ModuleTargetCompatiblePayloads   = 'module.target_compatible_payloads';
export const ModuleTargetCompatibleEvasionPayloads = 'module.target_compatible_evasion_payloads';
export const ModuleEncodeFormats        = 'module.encode_formats';
export const ModuleEncode               = 'module.encode';
export const ModuleSearch               = 'module.search';
export const ModuleExecute              = 'module.execute';
export const ModuleCheck                = 'module.check';
export const ModuleResults              = 'module.results';
export const ModuleRunningStats         = 'module.running_stats';

//
// Plugins
export const PluginLoad                 = 'plugin.load';
export const PluginUnload               = 'plugin.unload';
export const PluginLoaded               = 'plugin.loaded';

//
// Sessions (session.*)
export const SessionList                = 'session.list';
export const SessionStop                = 'session.stop';
export const SessionShellRead           = 'session.shell_read';
export const SessionShellWrite          = 'session.shell_write';
export const SessionShellUpgrade        = 'session.shell_upgrade';
export const SessionMeterpreterRead     = 'session.meterpreter_read';
export const SessionMeterpreterWrite    = 'session.meterpreter_write';
export const SessionMeterpreterSessionDetach = 'session.meterpreter_session_detach';
export const SessionMeterpreterSessionKill   = 'session.meterpreter_session_kill';
export const SessionMeterpreterTabs     = 'session.meterpreter_tabs';
export const SessionMeterpreterRunSingle = 'session.meterpreter_run_single';
export const SessionMeterpreterScript   = 'session.meterpreter_script';
export const SessionMeterpreterDirectorySeparator = 'session.meterpreter_directory_separator';
export const SessionRingRead            = 'session.ring_read';
export const SessionRingPut             = 'session.ring_put';
export const SessionRingLast            = 'session.ring_last';
export const SessionRingClear           = 'session.ring_clear';
export const SessionCompatibleModules   = 'session.compatible_modules';