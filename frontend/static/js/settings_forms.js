/*
 * Settings forms for Huntarr
 * This file handles generating HTML forms for each app's settings
 */

const SettingsForms = {
  // Check if Swaparr is globally enabled
  isSwaparrGloballyEnabled: function () {
    // Try to get Swaparr settings from cache or current settings
    try {
      // First check the DOM - if we're on the Swaparr page, check the toggle directly
      const swaparrToggle = document.querySelector("#swaparr_enabled");
      if (swaparrToggle) {
        console.log(
          `[SettingsForms] Reading Swaparr state from DOM toggle: ${swaparrToggle.checked}`
        );
        return swaparrToggle.checked;
      }

      // Check if we have cached settings
      const cachedSettings = localStorage.getItem("huntarr-settings-cache");
      if (cachedSettings) {
        const settings = JSON.parse(cachedSettings);
        if (settings.swaparr && settings.swaparr.enabled !== undefined) {
          console.log(
            `[SettingsForms] Reading Swaparr state from cache: ${settings.swaparr.enabled}`
          );
          return settings.swaparr.enabled === true;
        }
      }

      // Fallback: check if we have current settings loaded
      if (
        window.huntarrUI &&
        window.huntarrUI.originalSettings &&
        window.huntarrUI.originalSettings.swaparr
      ) {
        console.log(
          `[SettingsForms] Reading Swaparr state from window settings: ${window.huntarrUI.originalSettings.swaparr.enabled}`
        );
        return window.huntarrUI.originalSettings.swaparr.enabled === true;
      }

      // If we can't determine the state, trigger an async fetch but return false for now
      console.log(
        "[SettingsForms] Cannot determine Swaparr state, fetching from server..."
      );
      this.fetchAndCacheSwaparrState().then(() => {
        // After fetching, trigger a visibility update
        setTimeout(() => {
          this.updateSwaparrFieldsDisabledState();
        }, 100);
      });
      return false;
    } catch (e) {
      console.warn("[SettingsForms] Error checking Swaparr global status:", e);
      return false; // Default to disabling the field if there's an error
    }
  },

  // Generate Sonarr settings form
  generateSonarrForm: function (container, settings = {}) {
    // Ensure settings is a valid object
    if (!settings || typeof settings !== "object") {
      settings = {};
    }

    // Temporarily suppress change detection during form generation
    const wasSuppressionActive = window._appsSuppressChangeDetection;
    window._appsSuppressChangeDetection = true;

    // Add data-app-type attribute to container
    container.setAttribute("data-app-type", "sonarr");

    // Make sure the instances array exists
    if (
      !settings.instances ||
      !Array.isArray(settings.instances) ||
      settings.instances.length === 0
    ) {
      settings.instances = [
        {
          name: "Default",
          api_url: settings.api_url || "", // Legacy support
          api_key: settings.api_key || "", // Legacy support
          enabled: true,
        },
      ];
    }

    // Add save button at the top
    let sonarrSaveButtonHtml = `
            <div style="margin-bottom: 20px;">
                <button type="button" id="sonarr-save-button" disabled style="
                    background: #6b7280;
                    color: #9ca3af;
                    border: 1px solid #4b5563;
                    padding: 8px 16px;
                    border-radius: 6px;
                    font-size: 14px;
                    font-weight: 500;
                    cursor: not-allowed;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    transition: all 0.2s ease;
                ">
                    <i class="fas fa-save"></i>
                    Save Changes
                </button>
            </div>
        `;

    // Create a container for instances
    let instancesHtml = `
            <div class="settings-group" style="
                background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%);
                border: 2px solid rgba(90, 109, 137, 0.3);
                border-radius: 12px;
                padding: 20px;
                margin: 15px 0 25px 0;
                box-shadow: 0 4px 12px rgba(90, 109, 137, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1);
            ">
                <h3>Sonarr Instances</h3>
                <div class="instances-container">
        `;

    // Generate form elements for each instance
    settings.instances.forEach((instance, index) => {
      // Set default values if not present
      const huntMissingItems =
        instance.hunt_missing_items !== undefined
          ? instance.hunt_missing_items
          : 1;
      const huntUpgradeItems =
        instance.hunt_upgrade_items !== undefined
          ? instance.hunt_upgrade_items
          : 0;
      const huntMissingMode = instance.hunt_missing_mode || "seasons_packs";
      const upgradeMode = instance.upgrade_mode || "seasons_packs";
      const stateManagementMode = instance.state_management_mode || "custom";
      const stateManagementHours = instance.state_management_hours || 168;

      instancesHtml += `
                <div class="instance-item" data-instance-id="${index}">
                    <div class="instance-header">
                        <h4>Instance ${index + 1}: ${
        instance.name || "Unnamed"
      }</h4>
                        <div class="instance-actions">
                            ${
                              index > 0
                                ? '<button type="button" class="remove-instance-btn">Remove</button>'
                                : ""
                            }
                            <span class="connection-status" id="sonarr-status-${index}" style="margin-left: 10px; font-weight: bold; font-size: 0.9em;"></span>
                        </div>
                    </div>
                    <div class="instance-content">
                        <div class="setting-item">
                            <label for="sonarr-enabled-${index}"><a href="https://plexguide.github.io/Huntarr.io/apps/sonarr.html#connection-settings" class="info-icon" title="Learn more about enabling/disabling instances" target="_blank" rel="noopener"><i class="fas fa-info-circle"></i></a>Enabled:</label>
                            <label class="toggle-switch" style="width:40px; height:20px; display:inline-block; position:relative;">
                                <input type="checkbox" id="sonarr-enabled-${index}" name="enabled" ${
        instance.enabled !== false ? "checked" : ""
      }>
                                <span class="toggle-slider" style="position:absolute; cursor:pointer; top:0; left:0; right:0; bottom:0; background-color:#3d4353; border-radius:20px; transition:0.4s;"></span>
                            </label>
                            <p class="setting-help">Enable or disable this Sonarr instance for processing</p>
                        </div>
                        <div class="setting-item">
                            <label for="sonarr-name-${index}"><a href="https://plexguide.github.io/Huntarr.io/apps/sonarr.html#connection-settings" class="info-icon" title="Learn more about naming your Sonarr instance" target="_blank" rel="noopener"><i class="fas fa-info-circle"></i></a>Name:</label>
                            <input type="text" id="sonarr-name-${index}" name="name" value="${
        instance.name || ""
      }" placeholder="Friendly name for this Sonarr instance">
                            <p class="setting-help">Friendly name for this Sonarr instance</p>
                        </div>
                        <div class="setting-item">
                            <label for="sonarr-url-${index}"><a href="https://plexguide.github.io/Huntarr.io/apps/sonarr.html#connection-settings" class="info-icon" title="Learn more about Sonarr URL configuration" target="_blank" rel="noopener"><i class="fas fa-info-circle"></i></a>URL:</label>
                            <input type="text" id="sonarr-url-${index}" name="api_url" value="${
        instance.api_url || ""
      }" placeholder="Base URL for Sonarr (e.g., http://localhost:8989)" data-instance-index="${index}">
                            <p class="setting-help">Base URL for Sonarr (e.g., http://localhost:8989)</p>
                        </div>
                        <div class="setting-item">
                            <label for="sonarr-key-${index}"><a href="https://plexguide.github.io/Huntarr.io/apps/sonarr.html#connection-settings" class="info-icon" title="Learn more about finding your Sonarr API key" target="_blank" rel="noopener"><i class="fas fa-info-circle"></i></a>API Key:</label>
                            <input type="text" id="sonarr-key-${index}" name="api_key" value="${
        instance.api_key || ""
      }" placeholder="API key for Sonarr" data-instance-index="${index}">
                            <p class="setting-help">API key for Sonarr</p>
                        </div>
                        <div class="setting-item">
                            <label for="sonarr-hunt-missing-items-${index}"><a href="https://plexguide.github.io/Huntarr.io/apps/sonarr.html#search-settings" class="info-icon" title="Learn more about missing items search for this instance" target="_blank" rel="noopener"><i class="fas fa-info-circle"></i></a>Missing Search:</label>
                            <input type="number" id="sonarr-hunt-missing-items-${index}" name="hunt_missing_items" min="0" value="${huntMissingItems}" style="width: 80px;">
                            <p class="setting-help">Number of missing items to search per cycle (0 to disable).</p>
                        </div>
                        <div class="setting-item">
                            <label for="sonarr-hunt-upgrade-items-${index}"><a href="https://plexguide.github.io/Huntarr.io/apps/sonarr.html#search-settings" class="info-icon" title="Learn more about upgrade items search for this instance" target="_blank" rel="noopener"><i class="fas fa-info-circle"></i></a>Upgrade Search:</label>
                            <input type="number" id="sonarr-hunt-upgrade-items-${index}" name="hunt_upgrade_items" min="0" value="${huntUpgradeItems}" style="width: 80px;">
                            <p class="setting-help">Number of episodes to upgrade per cycle (0 to disable).</p>
                        </div>
                        <div class="setting-item">
                            <label for="sonarr-hunt-missing-mode-${index}"><a href="https://plexguide.github.io/Huntarr.io/apps/sonarr.html#search-settings" class="info-icon" title="Learn more about missing search modes for this instance" target="_blank" rel="noopener"><i class="fas fa-info-circle"></i></a>Missing Search Mode:</label>
                            <select id="sonarr-hunt-missing-mode-${index}" name="hunt_missing_mode">
                                <option value="seasons_packs" ${
                                  huntMissingMode === "seasons_packs"
                                    ? "selected"
                                    : ""
                                }>Season Packs</option>
                                <option value="shows" ${
                                  huntMissingMode === "shows" ? "selected" : ""
                                }>Shows</option>
                                <option value="episodes" ${
                                  huntMissingMode === "episodes"
                                    ? "selected"
                                    : ""
                                }>Episodes</option>
                            </select>
                            <p class="setting-help">How to search for missing content for this instance (Season Packs recommended)</p>
                            <p class="setting-help" style="display: ${
                              huntMissingMode === "episodes" ? "block" : "none"
                            };" id="episodes-missing-warning-${index}">⚠️ Episodes mode makes more API calls and does not support tagging. Season Packs recommended.</p>
                        </div>
                        <div class="setting-item">
                            <label for="sonarr-upgrade-mode-${index}"><a href="https://plexguide.github.io/Huntarr.io/apps/sonarr.html#search-settings" class="info-icon" title="Learn more about upgrade modes for this instance" target="_blank" rel="noopener"><i class="fas fa-info-circle"></i></a>Upgrade Mode:</label>
                            <select id="sonarr-upgrade-mode-${index}" name="upgrade_mode">
                                <option value="seasons_packs" ${
                                  upgradeMode === "seasons_packs"
                                    ? "selected"
                                    : ""
                                }>Season Packs</option>
                                <option value="shows" ${
                                  upgradeMode === "shows" ? "selected" : ""
                                }>Shows</option>
                                <option value="episodes" ${
                                  upgradeMode === "episodes" ? "selected" : ""
                                }>Episodes</option>
                            </select>
                            <p class="setting-help">How to search for upgrades for this instance (Season Packs recommended)</p>
                            <p class="setting-help" style="display: ${
                              upgradeMode === "episodes" ? "block" : "none"
                            };" id="episodes-upgrade-warning-${index}">⚠️ Episodes mode makes more API calls and does not support tagging. Season Packs recommended.</p>
                        </div>
                        
                        <!-- Air Date Delay Setting (only visible when either upgrade or missing mode is in episodes mode) -->
                        <div class="setting-item" id="sonarr-air-date-delay-container-${index}" style="display: ${
        huntMissingMode === "episodes" ||
        upgradeMode === "episodes"
          ? "block"
          : "none"
      }; border-top: 1px solid rgba(90, 109, 137, 0.2); padding-top: 15px; margin-top: 15px;">
                            <label for="sonarr-air-date-delay-${index}"><a href="https://github.com/plexguide/Huntarr.io/issues/700" class="info-icon" title="Delay searching for episodes after their air date to allow better releases to appear" target="_blank" rel="noopener"><i class="fas fa-calendar-alt"></i></a>Air Date Search Delay:</label>
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <input type="number" id="sonarr-air-date-delay-${index}" name="air_date_delay_days" min="0" max="30" value="${
        instance.air_date_delay_days || 0
      }" style="width: 80px; padding: 8px 12px; border-radius: 6px; border: 1px solid rgba(255, 255, 255, 0.1); background-color: #374151; color: #d1d5db;">
                                <span style="color: #9ca3af; font-size: 14px;">days</span>
                            </div>
                            <p class="setting-help">Wait this many days after an episode airs before searching for it. Allows better quality releases to appear. Only applies when either upgrade or missing mode is set to episodes. (0 = search immediately)</p>
                        </div>
                        
                        <!-- Instance State Management -->
                        <div class="setting-item" style="border-top: 1px solid rgba(90, 109, 137, 0.2); padding-top: 15px; margin-top: 15px;">
                            <label for="sonarr-state-management-mode-${index}"><a href="https://plexguide.github.io/Huntarr.io/settings/settings.html#state-reset-hours" class="info-icon" title="Configure state management for this instance" target="_blank" rel="noopener"><i class="fas fa-database"></i></a>State Management:</label>
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <select id="sonarr-state-management-mode-${index}" name="state_management_mode" style="width: 150px; padding: 8px 12px; border-radius: 6px; cursor: pointer; border: 1px solid rgba(255, 255, 255, 0.1); background-color: #1f2937; color: #d1d5db;">
                                    <option value="custom" ${
                                      stateManagementMode === "custom"
                                        ? "selected"
                                        : ""
                                    }>Enabled</option>
                                    <option value="disabled" ${
                                      stateManagementMode === "disabled"
                                        ? "selected"
                                        : ""
                                    }>Disabled</option>
                                </select>
                                <button type="button" id="sonarr-state-reset-btn-${index}" class="btn btn-danger" style="display: ${
        stateManagementMode !== "disabled" ? "inline-flex" : "none"
      }; background: linear-gradient(145deg, rgba(231, 76, 60, 0.2), rgba(192, 57, 43, 0.15)); color: rgba(231, 76, 60, 0.9); border: 1px solid rgba(231, 76, 60, 0.3); padding: 6px 12px; border-radius: 6px; font-size: 12px; align-items: center; gap: 4px; cursor: pointer; transition: all 0.2s ease;">
                                    <i class="fas fa-redo"></i> Reset State
                                </button>
                            </div>
                            <p class="setting-help">Enable state management to track processed media and prevent reprocessing</p>
                        </div>
                        
                        <!-- State Management Hours (visible when enabled) -->
                        <div class="setting-item" id="sonarr-custom-state-hours-${index}" style="display: ${
        stateManagementMode === "custom" ? "block" : "none"
      }; margin-left: 20px; padding: 12px; background: linear-gradient(145deg, rgba(30, 39, 56, 0.3), rgba(22, 28, 40, 0.4)); border: 1px solid rgba(90, 109, 137, 0.15); border-radius: 8px;">
                            <label for="sonarr-state-management-hours-${index}" style="display: flex; align-items: center; gap: 8px;">
                                <i class="fas fa-clock" style="color: #6366f1;"></i>
                                Reset Interval:
                            </label>
                            <div style="display: flex; align-items: center; gap: 10px; margin-top: 8px;">
                                <input type="number" id="sonarr-state-management-hours-${index}" name="state_management_hours" min="1" max="8760" value="${stateManagementHours}" style="width: 80px; padding: 8px 12px; border-radius: 4px; border: 1px solid rgba(255, 255, 255, 0.1); background-color: #374151; color: #d1d5db;">
                                <span style="color: #9ca3af; font-size: 14px;">
                                    hours (<span id="sonarr-state-days-display-${index}">${(
        stateManagementHours / 24
      ).toFixed(1)}</span> days)
                                </span>
                            </div>
                            <p class="setting-help" style="font-size: 13px; color: #9ca3af; margin-top: 8px;">
                                <i class="fas fa-info-circle" style="margin-right: 4px;"></i>
                                State will automatically reset every <span id="sonarr-state-hours-text-${index}">${stateManagementHours}</span> hours
                            </p>
                        </div>
                        
                        <!-- State Status Display -->
                        <div class="setting-item" id="sonarr-state-status-${index}" style="display: ${
        stateManagementMode !== "disabled" ? "block" : "none"
      }; margin-left: 20px; padding: 10px; background: linear-gradient(145deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.05)); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 6px;">
                            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 13px;">
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <span style="color: #10b981; font-weight: 600;">
                                        <i class="fas fa-check-circle" style="margin-right: 4px;"></i>
                                        Active - Tracked Items: <span id="sonarr-state-items-count-${index}">0</span>
                                    </span>
                                </div>
                                <div style="text-align: right;">
                                    <div style="color: #9ca3af; font-size: 12px;">Next Reset:</div>
                                    <div id="sonarr-state-reset-time-${index}" style="color: #d1d5db; font-weight: 500;">Calculating...</div>
                                </div>
                            </div>
                        </div>
                        
                        ${
                          this.isSwaparrGloballyEnabled()
                            ? `<div class="setting-item">
                            <label for="sonarr-swaparr-${index}"><a href="https://plexguide.github.io/Huntarr.io/apps/swaparr.html" class="info-icon" title="Enable Swaparr stalled download monitoring for this instance" target="_blank" rel="noopener"><i class="fas fa-info-circle"></i></a>Swaparr:</label>
                            <label class="toggle-switch" style="width:40px; height:20px; display:inline-block; position:relative;">
                                <input type="checkbox" id="sonarr-swaparr-${index}" name="swaparr_enabled" ${
                                instance.swaparr_enabled === true
                                  ? "checked"
                                  : ""
                              }>
                                <span class="toggle-slider" style="position:absolute; cursor:pointer; top:0; left:0; right:0; bottom:0; background-color:#3d4353; border-radius:20px; transition:0.4s;"></span>
                            </label>
                            <p class="setting-help">Enable Swaparr to monitor and remove stalled downloads for this Sonarr instance</p>
                        </div>`
                            : ""
                        }
                    </div>
                </div>
            `;
    });

    instancesHtml += `
                </div> <!-- instances-container -->
                <div class="button-container" style="text-align: center; margin-top: 15px;">
                    <button type="button" class="add-instance-btn add-sonarr-instance-btn">
                        <i class="fas fa-plus"></i> Add Sonarr Instance (${settings.instances.length}/9)
                    </button>
                </div>
            </div> <!-- settings-group -->
        `;

    // Search Settings (Global)
    let searchSettingsHtml = `
            <div class="settings-group">
                <h3>Global Settings</h3>
                <div class="setting-item">
                    <label for="sonarr_sleep_duration"><a href="https://plexguide.github.io/Huntarr.io/apps/sonarr.html#search-settings" class="info-icon" title="Learn more about sleep duration" target="_blank" rel="noopener"><i class="fas fa-info-circle"></i></a>Sleep Duration (Minutes):</label>
                                        <input type="number" id="sonarr_sleep_duration" name="sleep_duration" min="10" value="${
                                          settings.sleep_duration !== undefined
                                            ? Math.round(
                                                settings.sleep_duration / 60
                                              )
                                            : 15
                                        }">
                    <p class="setting-help">Time in minutes between processing cycles (minimum 10 minutes)</p>
                </div>
                <div class="setting-item">
                    <label for="sonarr_hourly_cap"><a href="https://plexguide.github.io/Huntarr.io/apps/sonarr.html#search-settings" class="info-icon" title="Maximum API requests per hour for this app (20 is safe)" target="_blank" rel="noopener"><i class="fas fa-info-circle"></i></a>API Cap - Hourly:</label>
                    <input type="number" id="sonarr_hourly_cap" name="hourly_cap" min="1" max="400" value="${
                      settings.hourly_cap !== undefined
                        ? settings.hourly_cap
                        : 20
                    }">
                    <p class="setting-help">Maximum API requests per hour to prevent being banned by your indexers. Keep lower for safety (20-50 recommended). Max allowed: 400.</p>
                </div>
            </div>
            
            <div class="settings-group" id="sonarr-custom-tags">
                <h3>Custom Tags</h3>
                <div class="setting-item">
                    <label for="sonarr_tag_processed_items"><a href="https://github.com/plexguide/Huntarr.io/issues/382" class="info-icon" title="Learn more about tagging processed items" target="_blank" rel="noopener"><i class="fas fa-info-circle"></i></a>Tag Processed Items:</label>
                    <label class="toggle-switch" style="width:40px; height:20px; display:inline-block; position:relative;">
                        <input type="checkbox" id="sonarr_tag_processed_items" name="tag_processed_items" ${
                          settings.tag_processed_items !== false
                            ? "checked"
                            : ""
                        }>
                        <span class="toggle-slider" style="position:absolute; cursor:pointer; top:0; left:0; right:0; bottom:0; background-color:#3d4353; border-radius:20px; transition:0.4s;"></span>
                    </label>
                    <p class="setting-help">Enable custom tagging for processed items</p>
                </div>
                <div class="setting-item" id="sonarr-custom-tag-fields" style="display: ${
                  settings.tag_processed_items !== false ? "block" : "none"
                };">
                    <label for="sonarr_custom_tag_missing"><a href="https://github.com/plexguide/Huntarr.io/issues/579" class="info-icon" title="Customize the tag applied to missing items" target="_blank" rel="noopener"><i class="fas fa-info-circle"></i></a>Missing Items Tag:</label>
                    <input type="text" id="sonarr_custom_tag_missing" name="custom_tag_missing" maxlength="25" value="${
                      settings.custom_tags?.missing || "huntarr-missing"
                    }" placeholder="huntarr-missing">
                    <p class="setting-help">Custom tag for missing items (max 25 characters)</p>
                </div>
                <div class="setting-item" id="sonarr-custom-tag-fields-2" style="display: ${
                  settings.tag_processed_items !== false ? "block" : "none"
                };">
                    <label for="sonarr_custom_tag_upgrade"><a href="https://github.com/plexguide/Huntarr.io/issues/579" class="info-icon" title="Customize the tag applied to upgraded items" target="_blank" rel="noopener"><i class="fas fa-info-circle"></i></a>Upgrade Items Tag:</label>
                    <input type="text" id="sonarr_custom_tag_upgrade" name="custom_tag_upgrade" maxlength="25" value="${
                      settings.custom_tags?.upgrade || "huntarr-upgrade"
                    }" placeholder="huntarr-upgrade">
                    <p class="setting-help">Custom tag for upgraded items (max 25 characters)</p>
                </div>
                <div class="setting-item" id="sonarr-custom-tag-fields-3" style="display: ${
                  settings.tag_processed_items !== false ? "block" : "none"
                };">
                    <label for="sonarr_custom_tag_shows_missing"><a href="https://github.com/plexguide/Huntarr.io/issues/579" class="info-icon" title="Customize the tag applied to shows mode missing items" target="_blank" rel="noopener"><i class="fas fa-info-circle"></i></a>Shows Missing Tag:</label>
                    <input type="text" id="sonarr_custom_tag_shows_missing" name="custom_tag_shows_missing" maxlength="25" value="${
                      settings.custom_tags?.shows_missing ||
                      "huntarr-shows-missing"
                    }" placeholder="huntarr-shows-missing">
                    <p class="setting-help">Custom tag for missing items in shows mode (max 25 characters)</p>
                </div>
            </div>
            
            <div class="settings-group">
                <h3>Additional Options</h3>
                <div class="setting-item">
                    <label for="sonarr_monitored_only"><a href="https://plexguide.github.io/Huntarr.io/apps/sonarr.html#monitored-only" class="info-icon" title="Learn more about monitored only option" target="_blank" rel="noopener"><i class="fas fa-info-circle"></i></a>Monitored Only:</label>
                    <label class="toggle-switch" style="width:40px; height:20px; display:inline-block; position:relative;">
                        <input type="checkbox" id="sonarr_monitored_only" name="monitored_only" ${
                          settings.monitored_only !== false ? "checked" : ""
                        }>
                        <span class="toggle-slider" style="position:absolute; cursor:pointer; top:0; left:0; right:0; bottom:0; background-color:#3d4353; border-radius:20px; transition:0.4s;"></span>
                    </label>
                    <p class="setting-help">Only search for monitored items</p>
                </div>
                <div class="setting-item">
                    <label for="sonarr_skip_future_episodes"><a href="https://plexguide.github.io/Huntarr.io/apps/sonarr.html#skip-future-episodes" class="info-icon" title="Learn more about skipping future episodes" target="_blank" rel="noopener"><i class="fas fa-info-circle"></i></a>Skip Future Episodes:</label>
                    <label class="toggle-switch" style="width:40px; height:20px; display:inline-block; position:relative;">
                        <input type="checkbox" id="sonarr_skip_future_episodes" name="skip_future_episodes" ${
                          settings.skip_future_episodes !== false
                            ? "checked"
                            : ""
                        }>
                        <span class="toggle-slider" style="position:absolute; cursor:pointer; top:0; left:0; right:0; bottom:0; background-color:#3d4353; border-radius:20px; transition:0.4s;"></span>
                    </label>
                    <p class="setting-help">Skip searching for episodes with future air dates</p>
                </div>
            </div>
        `;

    // Set the content with save button at the top
    container.innerHTML =
      sonarrSaveButtonHtml + instancesHtml + searchSettingsHtml;

    // Setup instance management (add/remove/test)
    SettingsForms.setupInstanceManagement(
      container,
      "sonarr",
      (settings.instances || []).length
    );

    // Load state information for each instance
    settings.instances.forEach((instance, index) => {
      if (typeof huntarrUI !== "undefined" && huntarrUI.loadInstanceStateInfo) {
        setTimeout(() => {
          huntarrUI.loadInstanceStateInfo("sonarr", index);
        }, 500); // Small delay to ensure DOM is ready
      }
    });

    // Add event listeners for custom tags visibility
    const tagProcessedItemsToggle = container.querySelector(
      "#sonarr_tag_processed_items"
    );
    const customTagFields = [
      container.querySelector("#sonarr-custom-tag-fields"),
      container.querySelector("#sonarr-custom-tag-fields-2"),
      container.querySelector("#sonarr-custom-tag-fields-3"),
    ];

    if (tagProcessedItemsToggle) {
      tagProcessedItemsToggle.addEventListener("change", function () {
        customTagFields.forEach((field) => {
          if (field) {
            field.style.display = this.checked ? "block" : "none";
          }
        });
      });
    }

    // Add event listeners for per-instance episode mode warnings and state management
    settings.instances.forEach((instance, index) => {
      const huntMissingModeSelect = container.querySelector(
        `#sonarr-hunt-missing-mode-${index}`
      );
      const upgradeModelSelect = container.querySelector(
        `#sonarr-upgrade-mode-${index}`
      );
      const episodesMissingWarning = container.querySelector(
        `#episodes-missing-warning-${index}`
      );
      const episodesUpgradeWarning = container.querySelector(
        `#episodes-upgrade-warning-${index}`
      );

      if (huntMissingModeSelect && episodesMissingWarning) {
        huntMissingModeSelect.addEventListener("change", function () {
          if (this.value === "episodes") {
            episodesMissingWarning.style.display = "block";
          } else {
            episodesMissingWarning.style.display = "none";
          }
          // Update air date delay visibility
          updateAirDateDelayVisibility();
        });
      }

      if (upgradeModelSelect && episodesUpgradeWarning) {
        upgradeModelSelect.addEventListener("change", function () {
          if (this.value === "episodes") {
            episodesUpgradeWarning.style.display = "block";
          } else {
            episodesUpgradeWarning.style.display = "none";
          }
          // Update air date delay visibility
          updateAirDateDelayVisibility();
        });
      }

      // Function to update air date delay visibility based on selected modes
      function updateAirDateDelayVisibility() {
        const airDateDelayContainer = document.getElementById(
          `sonarr-air-date-delay-container-${index}`
        );
        if (airDateDelayContainer) {
          const missingMode = huntMissingModeSelect
            ? huntMissingModeSelect.value
            : "seasons_packs";
          const upgradeMode = upgradeModelSelect
            ? upgradeModelSelect.value
            : "seasons_packs";

          // Show if either missing or upgrade mode is episodes (not shows)
          const shouldShow =
            missingMode === "episodes" ||
            upgradeMode === "episodes";

          airDateDelayContainer.style.display = shouldShow ? "block" : "none";
        }
      }

      // State management mode change listeners
      const stateManagementModeSelect = container.querySelector(
        `#sonarr-state-management-mode-${index}`
      );
      const customStateHours = container.querySelector(
        `#sonarr-custom-state-hours-${index}`
      );
      const stateStatus = container.querySelector(
        `#sonarr-state-status-${index}`
      );
      const stateResetBtn = container.querySelector(
        `#sonarr-state-reset-btn-${index}`
      );

      if (stateManagementModeSelect) {
        stateManagementModeSelect.addEventListener("change", function () {
          const mode = this.value;

          // Show/hide hours and status sections
          if (customStateHours) {
            customStateHours.style.display =
              mode === "custom" ? "block" : "none";
          }

          if (stateStatus) {
            stateStatus.style.display = mode !== "disabled" ? "block" : "none";
          }

          if (stateResetBtn) {
            stateResetBtn.style.display =
              mode !== "disabled" ? "inline-flex" : "none";
          }
        });
      }

      // Reset button functionality
      if (stateResetBtn) {
        stateResetBtn.addEventListener("click", function () {
          if (
            confirm(
              "Are you sure you want to reset the state for this instance? This will clear all tracked processed media IDs and allow them to be reprocessed."
            )
          ) {
            SettingsForms.resetInstanceState("sonarr", index);
          }
        });
      }

      // Custom hours input change listener
      const stateHoursInput = container.querySelector(
        `#sonarr-state-management-hours-${index}`
      );
      const stateDaysDisplay = container.querySelector(
        `#sonarr-state-days-display-${index}`
      );
      const stateHoursText = container.querySelector(
        `#sonarr-state-hours-text-${index}`
      );
      const resetTimeElement = container.querySelector(
        `#sonarr-state-reset-time-${index}`
      );

      if (stateHoursInput) {
        stateHoursInput.addEventListener("input", function () {
          const hours = parseInt(this.value) || 168;
          const days = (hours / 24).toFixed(1);

          if (stateDaysDisplay) {
            stateDaysDisplay.textContent = days;
          }

          if (stateHoursText) {
            stateHoursText.textContent = hours;
          }

          // Don't calculate reset time here - let the server provide the locked time
          // The reset time should come from the database lock, not be calculated from current time
        });
      }
    });

    // Set up manual save functionality for Sonarr
    this.setupAppManualSave(container, "sonarr", settings);

    // Restore the original suppression state after a brief delay to allow form to fully render
    setTimeout(() => {
      window._appsSuppressChangeDetection = wasSuppressionActive;
      console.log(
        `[SettingsForms] Restored change detection suppression state: ${wasSuppressionActive}`
      );
    }, 100);
  },

  // Reset state for a specific instance
  resetInstanceState: function (appType, instanceIndex) {
    const supportedApps = [
      "sonarr",
      "radarr",
      "lidarr",
      "readarr",
      "whisparr",
      "eros",
    ];
    if (!supportedApps.includes(appType)) return;

    // Use consistent instance name detection logic (same as loadInstanceStateInfo)
    let instanceName = null;

    // Method 1: Try the name input field
    const instanceNameElement = document.querySelector(
      `#${appType}-name-${instanceIndex}`
    );
    if (
      instanceNameElement &&
      instanceNameElement.value &&
      instanceNameElement.value.trim()
    ) {
      instanceName = instanceNameElement.value.trim();
    }

    // Method 2: Try to get from the instance header/title
    if (!instanceName) {
      const instanceHeader = document.querySelector(
        `#${appType}-instance-${instanceIndex} h3, #${appType}-instance-${instanceIndex} .instance-title, .instance-header h4`
      );
      if (instanceHeader && instanceHeader.textContent) {
        // Extract instance name from header text like "Instance 1: Default" or "Instance 2: EP Mode"
        const headerText = instanceHeader.textContent.trim();
        const match = headerText.match(/Instance \d+:\s*(.+)$/);
        if (match && match[1]) {
          instanceName = match[1].trim();
        }
      }
    }

    // Method 3: Fallback to Default for first instance, descriptive name for others
    if (!instanceName) {
      instanceName =
        instanceIndex === 0 ? "Default" : `Instance ${instanceIndex + 1}`;
    }

    console.log(
      `[SettingsForms] Resetting state for ${appType}/${instanceName} (index ${instanceIndex})`
    );

    // Call the reset API endpoint
    HuntarrUtils.fetchWithTimeout("./api/stateful/reset", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        app_type: appType,
        instance_name: instanceName,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          // Show success message and reload state info from server
          const itemsCountElement = document.getElementById(
            `${appType}-state-items-count-${instanceIndex}`
          );
          const resetTimeElement = document.getElementById(
            `${appType}-state-reset-time-${instanceIndex}`
          );

          if (itemsCountElement) {
            itemsCountElement.textContent = "0";
          }

          // Reload state information from server to get accurate reset time
          if (
            resetTimeElement &&
            typeof huntarrUI !== "undefined" &&
            typeof huntarrUI.loadInstanceStateInfo === "function"
          ) {
            huntarrUI.loadInstanceStateInfo(appType, instanceIndex);
          } else if (resetTimeElement) {
            resetTimeElement.textContent = "Reloading...";
          }

          console.log(
            `[SettingsForms] Successfully reset state for ${appType} instance ${instanceIndex}`
          );
        } else {
          console.error(
            `[SettingsForms] Failed to reset state: ${
              data.message || "Unknown error"
            }`
          );
          alert("Failed to reset state. Please check the logs for details.");
        }
      })
      .catch((error) => {
        console.error(
          `[SettingsForms] Error resetting state for ${appType} instance ${instanceIndex}:`,
          error
        );
        alert("Error resetting state. Please check the logs for details.");
      });
  },

  // Setup event listeners for per-instance reset buttons
  setupInstanceResetListeners: function () {
    // Use event delegation to handle dynamically created reset buttons
    document.addEventListener("click", (e) => {
      if (
        e.target.matches('[id*="-state-reset-btn-"]') ||
        e.target.closest('[id*="-state-reset-btn-"]')
      ) {
        const button = e.target.matches('[id*="-state-reset-btn-"]')
          ? e.target
          : e.target.closest('[id*="-state-reset-btn-"]');
        const buttonId = button.id;

        // Extract app type and instance index from button ID
        // Format: apptype-state-reset-btn-index
        const match = buttonId.match(/^(\w+)-state-reset-btn-(\d+)$/);
        if (match) {
          const appType = match[1];
          const instanceIndex = parseInt(match[2]);

          // Confirm before resetting
          // Use consistent instance name detection (same as resetInstanceState)
          let instanceName = null;
          const instanceNameElement = document.querySelector(
            `#${appType}-name-${instanceIndex}`
          );
          if (
            instanceNameElement &&
            instanceNameElement.value &&
            instanceNameElement.value.trim()
          ) {
            instanceName = instanceNameElement.value.trim();
          }
          if (!instanceName) {
            const instanceHeader = document.querySelector(
              `#${appType}-instance-${instanceIndex} h3, #${appType}-instance-${instanceIndex} .instance-title, .instance-header h4`
            );
            if (instanceHeader && instanceHeader.textContent) {
              const headerText = instanceHeader.textContent.trim();
              const match = headerText.match(/Instance \d+:\s*(.+)$/);
              if (match && match[1]) {
                instanceName = match[1].trim();
              }
            }
          }
          if (!instanceName) {
            instanceName =
              instanceIndex === 0 ? "Default" : `Instance ${instanceIndex + 1}`;
          }

          if (
            confirm(
              `Are you sure you want to reset the state for ${appType} instance "${instanceName}"? This will clear all tracked processed items.`
            )
          ) {
            this.resetInstanceState(appType, instanceIndex);
          }
        }
        e.preventDefault();
        e.stopPropagation();
      }
    });
  },

  // Generate Radarr settings form
  generateRadarrForm: function (container, settings = {}) {
    // Temporarily suppress change detection during form generation
    const wasSuppressionActive = window._appsSuppressChangeDetection;
    window._appsSuppressChangeDetection = true;

    // Add data-app-type attribute to container
    container.setAttribute("data-app-type", "radarr");

    // Make sure the instances array exists
    if (
      !settings.instances ||
      !Array.isArray(settings.instances) ||
      settings.instances.length === 0
    ) {
      settings.instances = [
        {
          name: "Default",
          api_url: settings.api_url || "",
          api_key: settings.api_key || "",
          enabled: true,
        },
      ];
    }

    // Add save button at the top
    let radarrSaveButtonHtml = `
            <div style="margin-bottom: 20px;">
                <button type="button" id="radarr-save-button" disabled style="
                    background: #6b7280;
                    color: #9ca3af;
                    border: 1px solid #4b5563;
                    padding: 8px 16px;
                    border-radius: 6px;
                    font-size: 14px;
                    font-weight: 500;
                    cursor: not-allowed;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    transition: all 0.2s ease;
                ">
                    <i class="fas fa-save"></i>
                    Save Changes
                </button>
            </div>
        `;

    // Create a container for instances with a scrollable area for many instances
    let instancesHtml = `
            <div class="settings-group">
                <h3>Radarr Instances</h3>
                <div class="instances-container">
        `;

    // Generate form elements for each instance
    settings.instances.forEach((instance, index) => {
      instancesHtml += `
                <div class="instance-item" data-instance-id="${index}">
                    <div class="instance-header">
                        <h4>Instance ${index + 1}: ${
        instance.name || "Unnamed"
      }</h4>
                        <div class="instance-actions">
                            ${
                              index > 0
                                ? '<button type="button" class="remove-instance-btn">Remove</button>'
                                : ""
                            }
                            <span class="connection-status" id="radarr-status-${index}" style="margin-left: 10px; font-weight: bold; font-size: 0.9em;"></span>
                        </div>
                    </div>
                    <div class="instance-content">
                        <div class="setting-item">
                            <label for="radarr-enabled-${index}"><a href="https://plexguide.github.io/Huntarr.io/apps/radarr.html#instances" class="info-icon" title="Learn more about enabling/disabling instances" target="_blank" rel="noopener"><i class="fas fa-info-circle"></i></a>Enabled:</label>
                            <label class="toggle-switch" style="width:40px; height:20px; display:inline-block; position:relative;">
                                <input type="checkbox" id="radarr-enabled-${index}" name="enabled" ${
        instance.enabled !== false ? "checked" : ""
      }>
                                <span class="toggle-slider" style="position:absolute; cursor:pointer; top:0; left:0; right:0; bottom:0; background-color:#3d4353; border-radius:20px; transition:0.4s;"></span>
                            </label>
                            <p class="setting-help">Enable or disable this Radarr instance for processing</p>
                        </div>
                        <div class="setting-item">
                            <label for="radarr-name-${index}"><a href="https://plexguide.github.io/Huntarr.io/apps/radarr.html#instances" class="info-icon" title="Learn more about naming your Radarr instance" target="_blank" rel="noopener"><i class="fas fa-info-circle"></i></a>Name:</label>
                            <input type="text" id="radarr-name-${index}" name="name" value="${
        instance.name || ""
      }" placeholder="Friendly name for this Radarr instance">
                            <p class="setting-help">Friendly name for this Radarr instance</p>
                        </div>
                        <div class="setting-item">
                            <label for="radarr-url-${index}"><a href="https://plexguide.github.io/Huntarr.io/apps/radarr.html#instances" class="info-icon" title="Learn more about Radarr URL configuration" target="_blank" rel="noopener"><i class="fas fa-info-circle"></i></a>URL:</label>
                            <input type="text" id="radarr-url-${index}" name="api_url" value="${
        instance.api_url || ""
      }" placeholder="Base URL for Radarr (e.g., http://localhost:7878)" data-instance-index="${index}">
                            <p class="setting-help">Base URL for Radarr (e.g., http://localhost:7878)</p>
                        </div>
                        <div class="setting-item">
                            <label for="radarr-key-${index}"><a href="https://plexguide.github.io/Huntarr.io/apps/radarr.html#instances" class="info-icon" title="Learn more about finding your Radarr API key" target="_blank" rel="noopener"><i class="fas fa-info-circle"></i></a>API Key:</label>
                            <input type="text" id="radarr-key-${index}" name="api_key" value="${
        instance.api_key || ""
      }" placeholder="API key for Radarr" data-instance-index="${index}">
                            <p class="setting-help">API key for Radarr</p>
                        </div>

                        <div class="setting-item">
                            <label for="radarr-hunt-missing-movies-${index}"><a href="https://plexguide.github.io/Huntarr.io/apps/radarr.html#search-settings" class="info-icon" title="Learn more about missing movies search for this instance" target="_blank" rel="noopener"><i class="fas fa-info-circle"></i></a>Missing Search:</label>
                            <input type="number" id="radarr-hunt-missing-movies-${index}" name="hunt_missing_movies" min="0" value="${
        instance.hunt_missing_movies !== undefined
          ? instance.hunt_missing_movies
          : 1
      }" style="width: 80px;">
                            <p class="setting-help">Number of missing movies to search per cycle (0 to disable).</p>
                        </div>
                        <div class="setting-item">
                            <label for="radarr-hunt-upgrade-movies-${index}"><a href="https://plexguide.github.io/Huntarr.io/apps/radarr.html#search-settings" class="info-icon" title="Learn more about upgrading movies for this instance" target="_blank" rel="noopener"><i class="fas fa-info-circle"></i></a>Upgrade Search:</label>
                            <input type="number" id="radarr-hunt-upgrade-movies-${index}" name="hunt_upgrade_movies" min="0" value="${
        instance.hunt_upgrade_movies !== undefined
          ? instance.hunt_upgrade_movies
          : 0
      }" style="width: 80px;">
                            <p class="setting-help">Number of movies to search for quality upgrades per cycle (0 to disable).</p>
                        </div>
                        
                        <!-- Release Date Delay Setting -->
                        <div class="setting-item" style="border-top: 1px solid rgba(90, 109, 137, 0.2); padding-top: 15px; margin-top: 15px;">
                            <label for="radarr-release-date-delay-${index}"><a href="https://github.com/plexguide/Huntarr.io/issues/693" class="info-icon" title="Delay searching for movies after their release date to allow better releases to appear" target="_blank" rel="noopener"><i class="fas fa-calendar-alt"></i></a>Release Date Search Delay:</label>
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <input type="number" id="radarr-release-date-delay-${index}" name="release_date_delay_days" min="0" max="365" value="${instance.release_date_delay_days || 0}" style="width: 80px; padding: 8px 12px; border-radius: 6px; border: 1px solid rgba(255, 255, 255, 0.1); background-color: #374151; color: #d1d5db;">
                                <span style="color: #9ca3af; font-size: 14px;">days</span>
                            </div>
                            <p class="setting-help">Wait this many days after a movie's release date before searching for it. Allows better quality releases to appear. Movies without release dates are processed immediately. (0 = search immediately)</p>
                        </div>
                        
                        <!-- Instance State Management -->
                        <div class="setting-item" style="border-top: 1px solid rgba(90, 109, 137, 0.2); padding-top: 15px; margin-top: 15px;">
                            <label for="radarr-state-management-mode-${index}"><a href="https://plexguide.github.io/Huntarr.io/settings/settings.html#state-reset-hours" class="info-icon" title="Configure state management for this instance" target="_blank" rel="noopener"><i class="fas fa-database"></i></a>State Management:</label>
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <select id="radarr-state-management-mode-${index}" name="state_management_mode" style="width: 150px; padding: 8px 12px; border-radius: 6px; cursor: pointer; border: 1px solid rgba(255, 255, 255, 0.1); background-color: #1f2937; color: #d1d5db;">
                                    <option value="custom" ${
                                      (instance.state_management_mode ||
                                        "custom") === "custom"
                                        ? "selected"
                                        : ""
                                    }>Enabled</option>
                                    <option value="disabled" ${
                                      (instance.state_management_mode ||
                                        "custom") === "disabled"
                                        ? "selected"
                                        : ""
                                    }>Disabled</option>
                                </select>
                                <button type="button" id="radarr-state-reset-btn-${index}" class="btn btn-danger" style="display: ${
        (instance.state_management_mode || "custom") !== "disabled"
          ? "inline-flex"
          : "none"
      }; background: linear-gradient(145deg, rgba(231, 76, 60, 0.2), rgba(192, 57, 43, 0.15)); color: rgba(231, 76, 60, 0.9); border: 1px solid rgba(231, 76, 60, 0.3); padding: 6px 12px; border-radius: 6px; font-size: 12px; align-items: center; gap: 4px; cursor: pointer; transition: all 0.2s ease;">
                                    <i class="fas fa-redo"></i> Reset State
                                </button>
                            </div>
                            <p class="setting-help">Enable state management to track processed media and prevent reprocessing</p>
                        </div>
                        
                        <!-- State Management Hours (visible when enabled) -->
                        <div class="setting-item" id="radarr-custom-state-hours-${index}" style="display: ${
        (instance.state_management_mode || "custom") === "custom"
          ? "block"
          : "none"
      }; margin-left: 20px; padding: 12px; background: linear-gradient(145deg, rgba(30, 39, 56, 0.3), rgba(22, 28, 40, 0.4)); border: 1px solid rgba(90, 109, 137, 0.15); border-radius: 8px;">
                            <label for="radarr-state-management-hours-${index}">
                                <i class="fas fa-clock" style="color: #6366f1;"></i>
                                Reset Interval:
                            </label>
                            <div style="display: flex; align-items: center; gap: 10px; margin-top: 8px;">
                                <input type="number" id="radarr-state-management-hours-${index}" name="state_management_hours" min="1" max="8760" value="${
        instance.state_management_hours || 168
      }" style="width: 80px; padding: 8px 12px; border-radius: 4px; border: 1px solid rgba(255, 255, 255, 0.1); background-color: #374151; color: #d1d5db;">
                                <span style="color: #9ca3af; font-size: 14px;">
                                    hours (<span id="radarr-state-days-display-${index}">${(
        (instance.state_management_hours || 168) / 24
      ).toFixed(1)}</span> days)
                                </span>
                            </div>
                            <p class="setting-help" style="font-size: 13px; color: #9ca3af; margin-top: 8px;">
                                <i class="fas fa-info-circle" style="margin-right: 4px;"></i>
                                State will automatically reset every <span id="radarr-state-hours-text-${index}">${
        instance.state_management_hours || 168
      }</span> hours
                            </p>
                        </div>
                        
                        <!-- State Status Display -->
                        <div class="setting-item" id="radarr-state-status-${index}" style="display: ${
        (instance.state_management_mode || "custom") !== "disabled"
          ? "block"
          : "none"
      }; margin-left: 20px; padding: 10px; background: linear-gradient(145deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.05)); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 6px;">
                            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 13px;">
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <span style="color: #10b981; font-weight: 600;">
                                        <i class="fas fa-check-circle" style="margin-right: 4px;"></i>
                                        Active - Tracked Items: <span id="radarr-state-items-count-${index}">0</span>
                                    </span>
                                </div>
                                <div style="text-align: right;">
                                    <div style="color: #9ca3af; font-size: 12px;">Next Reset:</div>
                                    <div id="radarr-state-reset-time-${index}" style="color: #d1d5db; font-weight: 500;">Calculating...</div>
                                </div>
                            </div>
                        </div>
                        
                        ${
                          this.isSwaparrGloballyEnabled()
                            ? `<div class="setting-item">
                            <label for="radarr-swaparr-${index}"><a href="https://plexguide.github.io/Huntarr.io/apps/swaparr.html" class="info-icon" title="Enable Swaparr stalled download monitoring for this instance" target="_blank" rel="noopener"><i class="fas fa-info-circle"></i></a>Swaparr:</label>
                            <label class="toggle-switch" style="width:40px; height:20px; display:inline-block; position:relative;">
                                <input type="checkbox" id="radarr-swaparr-${index}" name="swaparr_enabled" ${
                                instance.swaparr_enabled === true
                                  ? "checked"
                                  : ""
                              }>
                                <span class="toggle-slider" style="position:absolute; cursor:pointer; top:0; left:0; right:0; bottom:0; background-color:#3d4353; border-radius:20px; transition:0.4s;"></span>
                            </label>
                            <p class="setting-help">Enable Swaparr to monitor and remove stalled downloads for this Radarr instance</p>
                        </div>`
                            : ""
                        }
                    </div>
                </div>
            `;
    });

    // Add a button to add new instances (limit to 9 total)
    instancesHtml += `
                </div> <!-- instances-container -->
                <div class="button-container" style="text-align: center; margin-top: 15px;">
                    <button type="button" class="add-instance-btn add-radarr-instance-btn">
                        <i class="fas fa-plus"></i> Add Radarr Instance (${settings.instances.length}/9)
                    </button>
                </div>
            </div> <!-- settings-group -->
        `;

    // Continue with the rest of the settings form
    let searchSettingsHtml = `
            <div class="settings-group">
                <h3>Search Settings</h3>
                <div class="setting-item">
                    <label for="radarr_sleep_duration"><a href="https://plexguide.github.io/Huntarr.io/apps/radarr.html#search-settings" class="info-icon" title="Learn more about sleep duration" target="_blank" rel="noopener"><i class="fas fa-info-circle"></i></a>Sleep Duration (Minutes):</label>
                                        <input type="number" id="radarr_sleep_duration" name="sleep_duration" min="10" value="${
                                          settings.sleep_duration !== undefined
                                            ? Math.round(
                                                settings.sleep_duration / 60
                                              )
                                            : 15
                                        }">
                    <p class="setting-help">Time in minutes between processing cycles (minimum 10 minutes)</p>
                </div>
                <div class="setting-item">
                    <label for="radarr_hourly_cap"><a href="https://plexguide.github.io/Huntarr.io/apps/radarr.html#search-settings" class="info-icon" title="Maximum API requests per hour for this app" target="_blank" rel="noopener"><i class="fas fa-info-circle"></i></a>API Cap - Hourly:</label>
                    <input type="number" id="radarr_hourly_cap" name="hourly_cap" min="1" max="400" value="${
                      settings.hourly_cap !== undefined
                        ? settings.hourly_cap
                        : 20
                    }">
                    <p class="setting-help">Maximum API requests per hour to prevent being banned by your indexers. Keep lower for safety (20-50 recommended). Max allowed: 400.</p>
                </div>
            </div>
            
            <div class="settings-group" id="radarr-custom-tags">
                <h3>Custom Tags</h3>
                <div class="setting-item">
                    <label for="radarr_tag_processed_items"><a href="https://github.com/plexguide/Huntarr.io/issues/382" class="info-icon" title="Learn more about tagging processed items" target="_blank" rel="noopener"><i class="fas fa-info-circle"></i></a>Tag Processed Items:</label>
                    <label class="toggle-switch" style="width:40px; height:20px; display:inline-block; position:relative;">
                        <input type="checkbox" id="radarr_tag_processed_items" name="tag_processed_items" ${
                          settings.tag_processed_items !== false
                            ? "checked"
                            : ""
                        }>
                        <span class="toggle-slider" style="position:absolute; cursor:pointer; top:0; left:0; right:0; bottom:0; background-color:#3d4353; border-radius:20px; transition:0.4s;"></span>
                    </label>
                    <p class="setting-help">Enable custom tagging for processed items</p>
                </div>
                <div class="setting-item" id="radarr-custom-tag-fields" style="display: ${
                  settings.tag_processed_items !== false ? "block" : "none"
                };">
                    <label for="radarr_custom_tag_missing"><a href="https://github.com/plexguide/Huntarr.io/issues/579" class="info-icon" title="Customize the tag applied to missing movies" target="_blank" rel="noopener"><i class="fas fa-info-circle"></i></a>Missing Movies Tag:</label>
                    <input type="text" id="radarr_custom_tag_missing" name="custom_tag_missing" maxlength="25" value="${
                      settings.custom_tags?.missing || "huntarr-missing"
                    }" placeholder="huntarr-missing">
                    <p class="setting-help">Custom tag for missing movies (max 25 characters)</p>
                </div>
                <div class="setting-item" id="radarr-custom-tag-fields-2" style="display: ${
                  settings.tag_processed_items !== false ? "block" : "none"
                };">
                    <label for="radarr_custom_tag_upgrade"><a href="https://github.com/plexguide/Huntarr.io/issues/579" class="info-icon" title="Customize the tag applied to upgraded movies" target="_blank" rel="noopener"><i class="fas fa-info-circle"></i></a>Upgrade Movies Tag:</label>
                    <input type="text" id="radarr_custom_tag_upgrade" name="custom_tag_upgrade" maxlength="25" value="${
                      settings.custom_tags?.upgrade || "huntarr-upgrade"
                    }" placeholder="huntarr-upgrade">
                    <p class="setting-help">Custom tag for upgraded movies (max 25 characters)</p>
                </div>
            </div>
            
            <div class="settings-group">
                <h3>Additional Options</h3>
                <div class="setting-item">
                    <label for="radarr_monitored_only"><a href="https://plexguide.github.io/Huntarr.io/apps/radarr.html#monitored-only" class="info-icon" title="Learn more about monitored only option" target="_blank" rel="noopener"><i class="fas fa-info-circle"></i></a>Monitored Only:</label>
                    <label class="toggle-switch" style="width:40px; height:20px; display:inline-block; position:relative;">
                        <input type="checkbox" id="radarr_monitored_only" ${
                          settings.monitored_only !== false ? "checked" : ""
                        }>
                        <span class="toggle-slider" style="position:absolute; cursor:pointer; top:0; left:0; right:0; bottom:0; background-color:#3d4353; border-radius:20px; transition:0.4s;"></span>
                    </label>
                    <p class="setting-help">Only search for monitored items</p>
                </div>
                <div class="setting-item">
                    <label for="radarr_skip_future_releases"><a href="https://plexguide.github.io/Huntarr.io/apps/radarr.html#skip-future-movies" class="info-icon" title="Learn more about skipping future releases" target="_blank" rel="noopener"><i class="fas fa-info-circle"></i></a>Skip Future Releases:</label>
                    <label class="toggle-switch" style="width:40px; height:20px; display:inline-block; position:relative;">
                        <input type="checkbox" id="radarr_skip_future_releases" ${
                          settings.skip_future_releases !== false
                            ? "checked"
                            : ""
                        }>
                        <span class="toggle-slider" style="position:absolute; cursor:pointer; top:0; left:0; right:0; bottom:0; background-color:#3d4353; border-radius:20px; transition:0.4s;"></span>
                    </label>
                    <p class="setting-help">Skip searching for movies with future release dates (uses Release Date field)</p>
                </div>
                <div class="setting-item" id="process_no_release_dates_container" style="${
                  settings.skip_future_releases !== false
                    ? ""
                    : "display: none;"
                }">
                    <label for="radarr_process_no_release_dates"><a href="https://plexguide.github.io/Huntarr.io/apps/radarr.html#process-no-release-dates" class="info-icon" title="Learn more about processing movies with no release dates" target="_blank" rel="noopener"><i class="fas fa-info-circle"></i></a>Process No Release Dates:</label>
                    <label class="toggle-switch" style="width:40px; height:20px; display:inline-block; position:relative;">
                        <input type="checkbox" id="radarr_process_no_release_dates" ${
                          settings.process_no_release_dates === true
                            ? "checked"
                            : ""
                        }>
                        <span class="toggle-slider" style="position:absolute; cursor:pointer; top:0; left:0; right:0; bottom:0; background-color:#3d4353; border-radius:20px; transition:0.4s;"></span>
                    </label>
                                            <p class="setting-help">Rare case. Process movies with missing release date information - may result in unknown/poor quality downloads</p>
                </div>
            </div>
        `;

    // Set the content with save button at the top
    container.innerHTML =
      radarrSaveButtonHtml + instancesHtml + searchSettingsHtml;

    // Add event listeners for the instance management
    this.setupInstanceManagement(
      container,
      "radarr",
      (settings.instances || []).length
    );

    // Load state information for each instance
    settings.instances.forEach((instance, index) => {
      if (typeof huntarrUI !== "undefined" && huntarrUI.loadInstanceStateInfo) {
        setTimeout(() => {
          huntarrUI.loadInstanceStateInfo("radarr", index);
        }, 500); // Small delay to ensure DOM is ready
      }
    });

    // Add event listeners for per-instance state management
    settings.instances.forEach((instance, index) => {
      // State management mode change listeners
      const stateManagementModeSelect = container.querySelector(
        `#radarr-state-management-mode-${index}`
      );
      const customStateHours = container.querySelector(
        `#radarr-custom-state-hours-${index}`
      );
      const stateStatus = container.querySelector(
        `#radarr-state-status-${index}`
      );
      const stateResetBtn = container.querySelector(
        `#radarr-state-reset-btn-${index}`
      );

      if (stateManagementModeSelect) {
        stateManagementModeSelect.addEventListener("change", function () {
          const mode = this.value;

          // Show/hide hours and status sections
          if (customStateHours) {
            customStateHours.style.display =
              mode === "custom" ? "block" : "none";
          }

          if (stateStatus) {
            stateStatus.style.display = mode !== "disabled" ? "block" : "none";
          }

          if (stateResetBtn) {
            stateResetBtn.style.display =
              mode !== "disabled" ? "inline-flex" : "none";
          }
        });
      }

      // Reset button functionality
      if (stateResetBtn) {
        stateResetBtn.addEventListener("click", function () {
          if (
            confirm(
              "Are you sure you want to reset the state for this instance? This will clear all tracked processed media IDs and allow them to be reprocessed."
            )
          ) {
            SettingsForms.resetInstanceState("radarr", index);
          }
        });
      }

      // Custom hours input change listener
      const stateHoursInput = container.querySelector(
        `#radarr-state-management-hours-${index}`
      );
      const stateDaysDisplay = container.querySelector(
        `#radarr-state-days-display-${index}`
      );
      const stateHoursText = container.querySelector(
        `#radarr-state-hours-text-${index}`
      );
      const resetTimeElement = container.querySelector(
        `#radarr-state-reset-time-${index}`
      );

      if (stateHoursInput) {
        stateHoursInput.addEventListener("input", function () {
          const hours = parseInt(this.value) || 168;
          const days = (hours / 24).toFixed(1);

          if (stateDaysDisplay) {
            stateDaysDisplay.textContent = days;
          }

          if (stateHoursText) {
            stateHoursText.textContent = hours;
          }

          // Don't calculate reset time here - let the server provide the locked time
          // The reset time should come from the database lock, not be calculated from current time
        });
      }
    });

    // Set up event listeners for the skip_future_releases checkbox
    const skipFutureCheckbox = container.querySelector(
      "#radarr_skip_future_releases"
    );
    const noReleaseDatesContainer = container.querySelector(
      "#process_no_release_dates_container"
    );

    if (skipFutureCheckbox) {
      skipFutureCheckbox.addEventListener("change", function () {
        if (this.checked) {
          noReleaseDatesContainer.style.display = "";
        } else {
          noReleaseDatesContainer.style.display = "none";
        }
      });
    }

    // Add event listeners for custom tags visibility
    const radarrTagProcessedItemsToggle = container.querySelector(
      "#radarr_tag_processed_items"
    );
    const radarrCustomTagFields = [
      container.querySelector("#radarr-custom-tag-fields"),
      container.querySelector("#radarr-custom-tag-fields-2"),
    ];

    if (radarrTagProcessedItemsToggle) {
      radarrTagProcessedItemsToggle.addEventListener("change", function () {
        radarrCustomTagFields.forEach((field) => {
          if (field) {
            field.style.display = this.checked ? "block" : "none";
          }
        });
      });
    }

    // Set up manual save functionality for Radarr
    this.setupAppManualSave(container, "radarr", settings);

    // Restore the original suppression state after a brief delay to allow form to fully render
    setTimeout(() => {
      window._appsSuppressChangeDetection = wasSuppressionActive;
      console.log(
        `[SettingsForms] Restored change detection suppression state for Radarr: ${wasSuppressionActive}`
      );
    }, 100);
  },

  // Generate Lidarr settings form
  generateLidarrForm: function (container, settings = {}) {
    // Temporarily suppress change detection during form generation
    const wasSuppressionActive = window._appsSuppressChangeDetection;
    window._appsSuppressChangeDetection = true;

    // Add data-app-type attribute to container
    container.setAttribute("data-app-type", "lidarr");

    // Make sure the instances array exists
    if (
      !settings.instances ||
      !Array.isArray(settings.instances) ||
      settings.instances.length === 0
    ) {
      settings.instances = [
        {
          name: "Default",
          api_url: settings.api_url || "", // Legacy support
          api_key: settings.api_key || "", // Legacy support
          enabled: true,
        },
      ];
    }

    // Add save button at the top
    let lidarrSaveButtonHtml = `
            <div style="margin-bottom: 20px;">
                <button type="button" id="lidarr-save-button" disabled style="
                    background: #6b7280;
                    color: #9ca3af;
                    border: 1px solid #4b5563;
                    padding: 8px 16px;
                    border-radius: 6px;
                    font-size: 14px;
                    font-weight: 500;
                    cursor: not-allowed;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    transition: all 0.2s ease;
                ">
                    <i class="fas fa-save"></i>
                    Save Changes
                </button>
            </div>
        `;

    // Create a container for instances
    let instancesHtml = `
            <div class="settings-group">
                <h3>Lidarr Instances</h3>
                <div class="instances-container">
        `;

    // Generate form elements for each instance
    settings.instances.forEach((instance, index) => {
      instancesHtml += `
                <div class="instance-item" data-instance-id="${index}">
                    <div class="instance-header">
                        <h4>Instance ${index + 1}: ${
        instance.name || "Unnamed"
      }</h4>
                        <div class="instance-actions">
                            ${
                              index > 0
                                ? '<button type="button" class="remove-instance-btn">Remove</button>'
                                : ""
                            }
                            <span class="connection-status" id="lidarr-status-${index}" style="margin-left: 10px; font-weight: bold; font-size: 0.9em;"></span>
                        </div>
                    </div>
                    <div class="instance-content">
                        <div class="setting-item">
                            <label for="lidarr-enabled-${index}"><a href="https://plexguide.github.io/Huntarr.io/apps/lidarr.html#connection-settings" class="info-icon" title="Learn more about enabling/disabling instances" target="_blank" rel="noopener"><i class="fas fa-info-circle"></i></a>Enabled:</label>
                            <label class="toggle-switch" style="width:40px; height:20px; display:inline-block; position:relative;">
                                <input type="checkbox" id="lidarr-enabled-${index}" name="enabled" ${
        instance.enabled !== false ? "checked" : ""
      }>
                                <span class="toggle-slider" style="position:absolute; cursor:pointer; top:0; left:0; right:0; bottom:0; background-color:#3d4353; border-radius:20px; transition:0.4s;"></span>
                            </label>
                            <p class="setting-help">Enable or disable this Lidarr instance for processing</p>
                        </div>
                        <div class="setting-item">
                            <label for="lidarr-name-${index}"><a href="https://plexguide.github.io/Huntarr.io/apps/lidarr.html#connection-settings" class="info-icon" title="Learn more about naming your Lidarr instance" target="_blank" rel="noopener"><i class="fas fa-info-circle"></i></a>Name:</label>
                            <input type="text" id="lidarr-name-${index}" name="name" value="${
        instance.name || ""
      }" placeholder="Friendly name for this Lidarr instance">
                            <p class="setting-help">Friendly name for this Lidarr instance</p>
                        </div>
                        <div class="setting-item">
                            <label for="lidarr-url-${index}"><a href="https://plexguide.github.io/Huntarr.io/apps/lidarr.html#connection-settings" class="info-icon" title="Learn more about Lidarr URL configuration" target="_blank" rel="noopener"><i class="fas fa-info-circle"></i></a>URL:</label>
                            <input type="text" id="lidarr-url-${index}" name="api_url" value="${
        instance.api_url || ""
      }" placeholder="Base URL for Lidarr (e.g., http://localhost:8686)" data-instance-index="${index}">
                            <p class="setting-help">Base URL for Lidarr (e.g., http://localhost:8686)</p>
                        </div>
                        <div class="setting-item">
                            <label for="lidarr-key-${index}"><a href="https://plexguide.github.io/Huntarr.io/apps/lidarr.html#connection-settings" class="info-icon" title="Learn more about finding your Lidarr API key" target="_blank" rel="noopener"><i class="fas fa-info-circle"></i></a>API Key:</label>
                            <input type="text" id="lidarr-key-${index}" name="api_key" value="${
        instance.api_key || ""
      }" placeholder="API key for Lidarr" data-instance-index="${index}">
                            <p class="setting-help">API key for Lidarr</p>
                        </div>
                        <div class="setting-item">
                            <label for="lidarr-hunt-missing-items-${index}"><a href="https://plexguide.github.io/Huntarr.io/apps/lidarr.html#search-settings" class="info-icon" title="Learn more about missing items search for this instance" target="_blank" rel="noopener"><i class="fas fa-info-circle"></i></a>Missing Search:</label>
                            <input type="number" id="lidarr-hunt-missing-items-${index}" name="hunt_missing_items" min="0" value="${
        instance.hunt_missing_items !== undefined
          ? instance.hunt_missing_items
          : 1
      }" style="width: 80px;">
                            <p class="setting-help">Number of artists with missing albums to search per cycle (0 to disable).</p>
                        </div>
                        <div class="setting-item">
                            <label for="lidarr-hunt-upgrade-items-${index}"><a href="https://plexguide.github.io/Huntarr.io/apps/lidarr.html#search-settings" class="info-icon" title="Learn more about upgrading items for this instance" target="_blank" rel="noopener"><i class="fas fa-info-circle"></i></a>Upgrade Search:</label>
                            <input type="number" id="lidarr-hunt-upgrade-items-${index}" name="hunt_upgrade_items" min="0" value="${
        instance.hunt_upgrade_items !== undefined
          ? instance.hunt_upgrade_items
          : 0
      }" style="width: 80px;">
                            <p class="setting-help">Number of albums to search for quality upgrades per cycle (0 to disable).</p>
                        </div>
                        
                        <!-- Instance State Management -->
                        <div class="setting-item" style="border-top: 1px solid rgba(90, 109, 137, 0.2); padding-top: 15px; margin-top: 15px;">
                            <label for="lidarr-state-management-mode-${index}"><a href="https://plexguide.github.io/Huntarr.io/settings/settings.html#state-reset-hours" class="info-icon" title="Configure state management for this instance" target="_blank" rel="noopener"><i class="fas fa-database"></i></a>State Management:</label>
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <select id="lidarr-state-management-mode-${index}" name="state_management_mode" style="width: 150px; padding: 8px 12px; border-radius: 6px; cursor: pointer; border: 1px solid rgba(255, 255, 255, 0.1); background-color: #1f2937; color: #d1d5db;">
                                    <option value="custom" ${
                                      (instance.state_management_mode ||
                                        "custom") === "custom"
                                        ? "selected"
                                        : ""
                                    }>Enabled</option>
                                    <option value="disabled" ${
                                      (instance.state_management_mode ||
                                        "custom") === "disabled"
                                        ? "selected"
                                        : ""
                                    }>Disabled</option>
                                </select>
                                <button type="button" id="lidarr-state-reset-btn-${index}" class="btn btn-danger" style="display: ${
        (instance.state_management_mode || "custom") !== "disabled"
          ? "inline-flex"
          : "none"
      }; background: linear-gradient(145deg, rgba(231, 76, 60, 0.2), rgba(192, 57, 43, 0.15)); color: rgba(231, 76, 60, 0.9); border: 1px solid rgba(231, 76, 60, 0.3); padding: 6px 12px; border-radius: 6px; font-size: 12px; align-items: center; gap: 4px; cursor: pointer; transition: all 0.2s ease;">
                                    <i class="fas fa-redo"></i> Reset State
                                </button>
                            </div>
                            <p class="setting-help">Enable state management to track processed media and prevent reprocessing</p>
                        </div>
                        
                        <!-- State Management Hours (visible when enabled) -->
                        <div class="setting-item" id="lidarr-custom-state-hours-${index}" style="display: ${
        (instance.state_management_mode || "custom") === "custom"
          ? "block"
          : "none"
      }; margin-left: 20px; padding: 12px; background: linear-gradient(145deg, rgba(30, 39, 56, 0.3), rgba(22, 28, 40, 0.4)); border: 1px solid rgba(90, 109, 137, 0.15); border-radius: 8px;">
                            <label for="lidarr-state-management-hours-${index}">
                                <i class="fas fa-clock" style="color: #6366f1;"></i>
                                Reset Interval:
                            </label>
                            <div style="display: flex; align-items: center; gap: 10px; margin-top: 8px;">
                                <input type="number" id="lidarr-state-management-hours-${index}" name="state_management_hours" min="1" max="8760" value="${
        instance.state_management_hours || 168
      }" style="width: 80px; padding: 8px 12px; border-radius: 4px; border: 1px solid rgba(255, 255, 255, 0.1); background-color: #374151; color: #d1d5db;">
                                <span style="color: #9ca3af; font-size: 14px;">
                                    hours (<span id="lidarr-state-days-display-${index}">${(
        (instance.state_management_hours || 168) / 24
      ).toFixed(1)}</span> days)
                                </span>
                            </div>
                            <p class="setting-help" style="font-size: 13px; color: #9ca3af; margin-top: 8px;">
                                <i class="fas fa-info-circle" style="margin-right: 4px;"></i>
                                State will automatically reset every <span id="lidarr-state-hours-text-${index}">${
        instance.state_management_hours || 168
      }</span> hours
                            </p>
                        </div>
                        
                        <!-- State Status Display -->
                        <div class="setting-item" id="lidarr-state-status-${index}" style="display: ${
        (instance.state_management_mode || "custom") !== "disabled"
          ? "block"
          : "none"
      }; margin-left: 20px; padding: 10px; background: linear-gradient(145deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.05)); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 6px;">
                            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 13px;">
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <span style="color: #10b981; font-weight: 600;">
                                        <i class="fas fa-check-circle" style="margin-right: 4px;"></i>
                                        Active - Tracked Items: <span id="lidarr-state-items-count-${index}">0</span>
                                    </span>
                                </div>
                                <div style="text-align: right;">
                                    <div style="color: #9ca3af; font-size: 12px;">Next Reset:</div>
                                    <div id="lidarr-state-reset-time-${index}" style="color: #d1d5db; font-weight: 500;">Calculating...</div>
                                </div>
                            </div>
                        </div>
                        
                        ${
                          this.isSwaparrGloballyEnabled()
                            ? `<div class="setting-item">
                            <label for="lidarr-swaparr-${index}"><a href="https://plexguide.github.io/Huntarr.io/apps/swaparr.html" class="info-icon" title="Enable Swaparr stalled download monitoring for this instance" target="_blank" rel="noopener"><i class="fas fa-info-circle"></i></a>Swaparr:</label>
                            <label class="toggle-switch" style="width:40px; height:20px; display:inline-block; position:relative;">
                                <input type="checkbox" id="lidarr-swaparr-${index}" name="swaparr_enabled" ${
                                instance.swaparr_enabled === true
                                  ? "checked"
                                  : ""
                              }>
                                <span class="toggle-slider" style="position:absolute; cursor:pointer; top:0; left:0; right:0; bottom:0; background-color:#3d4353; border-radius:20px; transition:0.4s;"></span>
                            </label>
                            <p class="setting-help">Enable Swaparr to monitor and remove stalled downloads for this Lidarr instance</p>
                        </div>`
                            : ""
                        }
                    </div>
                </div>
            `;
    });

    instancesHtml += `
                </div> <!-- instances-container -->
                <div class="button-container" style="text-align: center; margin-top: 15px;">
                    <button type="button" class="add-instance-btn add-lidarr-instance-btn">
                        <i class="fas fa-plus"></i> Add Lidarr Instance (${settings.instances.length}/9)
                    </button>
                </div>
            </div> <!-- settings-group -->
        `;

    // Continue with the rest of the settings form
    container.innerHTML = `
            ${lidarrSaveButtonHtml}
            ${instancesHtml}
            
            <div class="settings-group">
                <h3>Search Settings</h3>
                <div class="setting-item">
                    <label for="lidarr_hunt_missing_mode"><a href="https://plexguide.github.io/Huntarr.io/apps/lidarr.html#search-settings" class="info-icon" title="Learn more about missing search modes" target="_blank" rel="noopener"><i class="fas fa-info-circle"></i></a>Missing Search Mode:</label>
                    <select id="lidarr_hunt_missing_mode" name="hunt_missing_mode">
                        <option value="album" selected>Album</option>
                    </select>
                    <p class="setting-help">Search for individual albums (Artist mode deprecated in Huntarr 7.5.0+)</p>
                </div>

                <div class="setting-item">
                    <label for="lidarr_sleep_duration"><a href="https://plexguide.github.io/Huntarr.io/apps/lidarr.html#search-settings" class="info-icon" title="Learn more about sleep duration" target="_blank" rel="noopener"><i class="fas fa-info-circle"></i></a>Sleep Duration (Minutes):</label>
                                        <input type="number" id="lidarr_sleep_duration" name="sleep_duration" min="10" value="${
                                          settings.sleep_duration !== undefined
                                            ? Math.round(
                                                settings.sleep_duration / 60
                                              )
                                            : 15
                                        }">
                    <p class="setting-help">Time in minutes between processing cycles (minimum 10 minutes)</p>
                </div>
                <div class="setting-item">
                    <label for="lidarr_hourly_cap"><a href="https://plexguide.github.io/Huntarr.io/apps/lidarr.html#search-settings" class="info-icon" title="Maximum API requests per hour for this app (20 is safe)" target="_blank" rel="noopener"><i class="fas fa-info-circle"></i></a>API Cap - Hourly:</label>
                    <input type="number" id="lidarr_hourly_cap" name="hourly_cap" min="1" max="400" value="${
                      settings.hourly_cap !== undefined
                        ? settings.hourly_cap
                        : 20
                    }">
                    <p class="setting-help">Maximum API requests per hour to prevent being banned by your indexers. Keep lower for safety (20-50 recommended). Max allowed: 400.</p>
                </div>
            </div>
            
            <div class="settings-group" id="lidarr-custom-tags">
                <h3>Custom Tags</h3>
                <div class="setting-item">
                    <label for="lidarr_tag_processed_items"><a href="https://github.com/plexguide/Huntarr.io/issues/382" class="info-icon" title="Learn more about tagging processed items" target="_blank" rel="noopener"><i class="fas fa-info-circle"></i></a>Tag Processed Items:</label>
                    <label class="toggle-switch" style="width:40px; height:20px; display:inline-block; position:relative;">
                        <input type="checkbox" id="lidarr_tag_processed_items" name="tag_processed_items" ${
                          settings.tag_processed_items !== false
                            ? "checked"
                            : ""
                        }>
                        <span class="toggle-slider" style="position:absolute; cursor:pointer; top:0; left:0; right:0; bottom:0; background-color:#3d4353; border-radius:20px; transition:0.4s;"></span>
                    </label>
                    <p class="setting-help">Enable custom tagging for processed items</p>
                </div>
                <div class="setting-item" id="lidarr-custom-tag-fields" style="display: ${
                  settings.tag_processed_items !== false ? "block" : "none"
                };">
                    <label for="lidarr_custom_tag_missing"><a href="https://github.com/plexguide/Huntarr.io/issues/579" class="info-icon" title="Customize the tag applied to missing items" target="_blank" rel="noopener"><i class="fas fa-info-circle"></i></a>Missing Albums Tag:</label>
                    <input type="text" id="lidarr_custom_tag_missing" name="custom_tag_missing" maxlength="25" value="${
                      settings.custom_tags?.missing || "huntarr-missing"
                    }" placeholder="huntarr-missing">
                    <p class="setting-help">Custom tag for missing albums (max 25 characters)</p>
                </div>
                <div class="setting-item" id="lidarr-custom-tag-fields-2" style="display: ${
                  settings.tag_processed_items !== false ? "block" : "none"
                };">
                    <label for="lidarr_custom_tag_upgrade"><a href="https://github.com/plexguide/Huntarr.io/issues/579" class="info-icon" title="Customize the tag applied to upgraded items" target="_blank" rel="noopener"><i class="fas fa-info-circle"></i></a>Upgrade Albums Tag:</label>
                    <input type="text" id="lidarr_custom_tag_upgrade" name="custom_tag_upgrade" maxlength="25" value="${
                      settings.custom_tags?.upgrade || "huntarr-upgrade"
                    }" placeholder="huntarr-upgrade">
                    <p class="setting-help">Custom tag for upgraded albums (max 25 characters)</p>
                </div>
            </div>
            
            <div class="settings-group">
                <h3>Additional Options</h3>
                <div class="setting-item">
                    <label for="lidarr_monitored_only"><a href="https://plexguide.github.io/Huntarr.io/apps/lidarr.html#monitored-only" class="info-icon" title="Learn more about monitored only option" target="_blank" rel="noopener"><i class="fas fa-info-circle"></i></a>Monitored Only:</label>
                    <label class="toggle-switch" style="width:40px; height:20px; display:inline-block; position:relative;">
                        <input type="checkbox" id="lidarr_monitored_only" ${
                          settings.monitored_only !== false ? "checked" : ""
                        }>
                        <span class="toggle-slider" style="position:absolute; cursor:pointer; top:0; left:0; right:0; bottom:0; background-color:#3d4353; border-radius:20px; transition:0.4s;"></span>
                    </label>
                    <p class="setting-help">Only search for monitored items</p>
                </div>
                <div class="setting-item">
                    <label for="lidarr_skip_future_releases"><a href="https://plexguide.github.io/Huntarr.io/apps/lidarr.html#skip-future-releases" class="info-icon" title="Learn more about skipping future releases" target="_blank" rel="noopener"><i class="fas fa-info-circle"></i></a>Skip Future Releases:</label>
                    <label class="toggle-switch" style="width:40px; height:20px; display:inline-block; position:relative;">
                        <input type="checkbox" id="lidarr_skip_future_releases" ${
                          settings.skip_future_releases !== false
                            ? "checked"
                            : ""
                        }>
                        <span class="toggle-slider" style="position:absolute; cursor:pointer; top:0; left:0; right:0; bottom:0; background-color:#3d4353; border-radius:20px; transition:0.4s;"></span>
                    </label>
                    <p class="setting-help">Skip searching for albums with future release dates</p>
                </div>
            </div>
        `;

    // Add event listeners for the instance management
    SettingsForms.setupInstanceManagement(
      container,
      "lidarr",
      (settings.instances || []).length
    );

    // Load state information for each instance
    settings.instances.forEach((instance, index) => {
      if (typeof huntarrUI !== "undefined" && huntarrUI.loadInstanceStateInfo) {
        setTimeout(() => {
          huntarrUI.loadInstanceStateInfo("lidarr", index);
        }, 500); // Small delay to ensure DOM is ready
      }
    });

    // Add event listeners for custom tags visibility
    const lidarrTagProcessedItemsToggle = container.querySelector(
      "#lidarr_tag_processed_items"
    );
    const lidarrCustomTagFields = [
      container.querySelector("#lidarr-custom-tag-fields"),
      container.querySelector("#lidarr-custom-tag-fields-2"),
    ];

    if (lidarrTagProcessedItemsToggle) {
      lidarrTagProcessedItemsToggle.addEventListener("change", function () {
        lidarrCustomTagFields.forEach((field) => {
          if (field) {
            field.style.display = this.checked ? "block" : "none";
          }
        });
      });
    }

    // Set up manual save functionality for Lidarr
    this.setupAppManualSave(container, "lidarr", settings);

    // Restore the original suppression state after a brief delay to allow form to fully render
    setTimeout(() => {
      window._appsSuppressChangeDetection = wasSuppressionActive;
      console.log(
        `[SettingsForms] Restored change detection suppression state for Lidarr: ${wasSuppressionActive}`
      );
    }, 100);
  },

  // Generate Readarr settings form
  generateReadarrForm: function (container, settings = {}) {
    // Temporarily suppress change detection during form generation
    const wasSuppressionActive = window._appsSuppressChangeDetection;
    window._appsSuppressChangeDetection = true;

    // Add data-app-type attribute to container
    container.setAttribute("data-app-type", "readarr");

    // Make sure the instances array exists
    if (
      !settings.instances ||
      !Array.isArray(settings.instances) ||
      settings.instances.length === 0
    ) {
      settings.instances = [
        {
          name: "Default",
          api_url: settings.api_url || "", // Legacy support
          api_key: settings.api_key || "", // Legacy support
          enabled: true,
        },
      ];
    }

    // Add save button at the top
    let readarrSaveButtonHtml = `
            <div style="margin-bottom: 20px;">
                <button type="button" id="readarr-save-button" disabled style="
                    background: #6b7280;
                    color: #9ca3af;
                    border: 1px solid #4b5563;
                    padding: 8px 16px;
                    border-radius: 6px;
                    font-size: 14px;
                    font-weight: 500;
                    cursor: not-allowed;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    transition: all 0.2s ease;
                ">
                    <i class="fas fa-save"></i>
                    Save Changes
                </button>
            </div>
        `;

    // Create a container for instances
    let instancesHtml = `
            <div class="settings-group">
                <h3>Readarr Instances</h3>
                <div class="instances-container">
        `;

    // Generate form elements for each instance
    settings.instances.forEach((instance, index) => {
      instancesHtml += `
                <div class="instance-item" data-instance-id="${index}">
                                        <div class="instance-header">
                        <h4>Instance ${index + 1}: ${
        instance.name || "Unnamed"
      }</h4>
                        <div class="instance-actions">
                            ${
                              index > 0
                                ? '<button type="button" class="remove-instance-btn">Remove</button>'
                                : ""
                            }
                            <span class="connection-status" id="readarr-status-${index}" style="margin-left: 10px; font-weight: bold; font-size: 0.9em;"></span>
                        </div>
                    </div>
                    <div class="instance-content">
                        <div class="setting-item">
                            <label for="readarr-enabled-${index}"><a href="https://plexguide.github.io/Huntarr.io/apps/readarr.html#connection-settings" class="info-icon" title="Learn more about enabling/disabling instances" target="_blank" rel="noopener"><i class="fas fa-info-circle"></i></a>Enabled:</label>
                            <label class="toggle-switch" style="width:40px; height:20px; display:inline-block; position:relative;">
                                <input type="checkbox" id="readarr-enabled-${index}" name="enabled" ${
        instance.enabled !== false ? "checked" : ""
      }>
                                <span class="toggle-slider" style="position:absolute; cursor:pointer; top:0; left:0; right:0; bottom:0; background-color:#3d4353; border-radius:20px; transition:0.4s;"></span>
                            </label>
                            <p class="setting-help">Enable or disable this Readarr instance for processing</p>
                        </div>
                        <div class="setting-item">
                                            <label for="readarr-name-${index}"><a href="https://plexguide.github.io/Huntarr.io/apps/readarr.html#connection-settings" class="info-icon" title="Learn more about naming your Readarr instance" target="_blank" rel="noopener"><i class="fas fa-info-circle"></i></a>Name:</label>
                <input type="text" id="readarr-name-${index}" name="name" value="${
        instance.name || ""
      }" placeholder="Friendly name for this Readarr instance">
                <p class="setting-help">Friendly name for this Readarr instance</p>
                </div>
                <div class="setting-item">
                <label for="readarr-url-${index}"><a href="https://plexguide.github.io/Huntarr.io/apps/readarr.html#connection-settings" class="info-icon" title="Learn more about Readarr URL configuration" target="_blank" rel="noopener"><i class="fas fa-info-circle"></i></a>URL:</label>
                                            <input type="text" id="readarr-url-${index}" name="api_url" value="${
        instance.api_url || ""
      }" placeholder="Base URL for Readarr (e.g., http://localhost:8787)" data-instance-index="${index}">
                <p class="setting-help">Base URL for Readarr (e.g., http://localhost:8787)</p>
                </div>
                <div class="setting-item">
                <label for="readarr-key-${index}"><a href="https://plexguide.github.io/Huntarr.io/apps/readarr.html#connection-settings" class="info-icon" title="Learn more about finding your Readarr API key" target="_blank" rel="noopener"><i class="fas fa-info-circle"></i></a>API Key:</label>
                                            <input type="text" id="readarr-key-${index}" name="api_key" value="${
        instance.api_key || ""
      }" placeholder="API key for Readarr" data-instance-index="${index}">
                <p class="setting-help">API key for Readarr</p>
                </div>
                        <div class="setting-item">
                            <label for="readarr-hunt-missing-books-${index}"><a href="https://plexguide.github.io/Huntarr.io/apps/readarr.html#search-settings" class="info-icon" title="Learn more about missing books search for this instance" target="_blank" rel="noopener"><i class="fas fa-info-circle"></i></a>Missing Search:</label>
                            <input type="number" id="readarr-hunt-missing-books-${index}" name="hunt_missing_books" min="0" value="${
        instance.hunt_missing_books !== undefined
          ? instance.hunt_missing_books
          : 1
      }" style="width: 80px;">
                            <p class="setting-help">Number of missing books to search per cycle (0 to disable).</p>
                        </div>
                        <div class="setting-item">
                            <label for="readarr-hunt-upgrade-books-${index}"><a href="https://plexguide.github.io/Huntarr.io/apps/readarr.html#search-settings" class="info-icon" title="Learn more about upgrade books search for this instance" target="_blank" rel="noopener"><i class="fas fa-info-circle"></i></a>Upgrade Search:</label>
                            <input type="number" id="readarr-hunt-upgrade-books-${index}" name="hunt_upgrade_books" min="0" value="${
        instance.hunt_upgrade_books !== undefined
          ? instance.hunt_upgrade_books
          : 0
      }" style="width: 80px;">
                            <p class="setting-help">Number of books to upgrade per cycle (0 to disable).</p>
                        </div>
                        
                        <!-- Instance State Management -->
                        <div class="setting-item" style="border-top: 1px solid rgba(90, 109, 137, 0.2); padding-top: 15px; margin-top: 15px;">
                            <label for="readarr-state-management-mode-${index}"><a href="https://plexguide.github.io/Huntarr.io/settings/settings.html#state-reset-hours" class="info-icon" title="Configure state management for this instance" target="_blank" rel="noopener"><i class="fas fa-database"></i></a>State Management:</label>
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <select id="readarr-state-management-mode-${index}" name="state_management_mode" style="width: 150px; padding: 8px 12px; border-radius: 6px; cursor: pointer; border: 1px solid rgba(255, 255, 255, 0.1); background-color: #1f2937; color: #d1d5db;">
                                    <option value="custom" ${
                                      (instance.state_management_mode ||
                                        "custom") === "custom"
                                        ? "selected"
                                        : ""
                                    }>Enabled</option>
                                    <option value="disabled" ${
                                      (instance.state_management_mode ||
                                        "custom") === "disabled"
                                        ? "selected"
                                        : ""
                                    }>Disabled</option>
                                </select>
                                <button type="button" id="readarr-state-reset-btn-${index}" class="btn btn-danger" style="display: ${
        (instance.state_management_mode || "custom") !== "disabled"
          ? "inline-flex"
          : "none"
      }; background: linear-gradient(145deg, rgba(231, 76, 60, 0.2), rgba(192, 57, 43, 0.15)); color: rgba(231, 76, 60, 0.9); border: 1px solid rgba(231, 76, 60, 0.3); padding: 6px 12px; border-radius: 6px; font-size: 12px; align-items: center; gap: 4px; cursor: pointer; transition: all 0.2s ease;">
                                    <i class="fas fa-redo"></i> Reset State
                                </button>
                            </div>
                            <p class="setting-help">Enable state management to track processed media and prevent reprocessing</p>
                        </div>
                        
                        <!-- State Management Hours (visible when enabled) -->
                        <div class="setting-item" id="readarr-custom-state-hours-${index}" style="display: ${
        (instance.state_management_mode || "custom") === "custom"
          ? "block"
          : "none"
      }; margin-left: 20px; padding: 12px; background: linear-gradient(145deg, rgba(30, 39, 56, 0.3), rgba(22, 28, 40, 0.4)); border: 1px solid rgba(90, 109, 137, 0.15); border-radius: 8px;">
                            <label for="readarr-state-management-hours-${index}">
                                <i class="fas fa-clock" style="color: #6366f1;"></i>
                                Reset Interval:
                            </label>
                            <div style="display: flex; align-items: center; gap: 10px; margin-top: 8px;">
                                <input type="number" id="readarr-state-management-hours-${index}" name="state_management_hours" min="1" max="8760" value="${
        instance.state_management_hours || 168
      }" style="width: 80px; padding: 8px 12px; border-radius: 4px; border: 1px solid rgba(255, 255, 255, 0.1); background-color: #374151; color: #d1d5db;">
                                <span style="color: #9ca3af; font-size: 14px;">
                                    hours (<span id="readarr-state-days-display-${index}">${(
        (instance.state_management_hours || 168) / 24
      ).toFixed(1)}</span> days)
                                </span>
                            </div>
                            <p class="setting-help" style="font-size: 13px; color: #9ca3af; margin-top: 8px;">
                                <i class="fas fa-info-circle" style="margin-right: 4px;"></i>
                                State will automatically reset every <span id="readarr-state-hours-text-${index}">${
        instance.state_management_hours || 168
      }</span> hours
                            </p>
                        </div>
                        
                        <!-- State Status Display -->
                        <div class="setting-item" id="readarr-state-status-${index}" style="display: ${
        (instance.state_management_mode || "custom") !== "disabled"
          ? "block"
          : "none"
      }; margin-left: 20px; padding: 10px; background: linear-gradient(145deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.05)); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 6px;">
                            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 13px;">
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <span style="color: #10b981; font-weight: 600;">
                                        <i class="fas fa-check-circle" style="margin-right: 4px;"></i>
                                        Active - Tracked Items: <span id="readarr-state-items-count-${index}">0</span>
                                    </span>
                                </div>
                                <div style="text-align: right;">
                                    <div style="color: #9ca3af; font-size: 12px;">Next Reset:</div>
                                    <div id="readarr-state-reset-time-${index}" style="color: #d1d5db; font-weight: 500;">Calculating...</div>
                                </div>
                            </div>
                        </div>
                        
                        ${
                          this.isSwaparrGloballyEnabled()
                            ? `<div class="setting-item">
                            <label for="readarr-swaparr-${index}"><a href="https://plexguide.github.io/Huntarr.io/apps/swaparr.html" class="info-icon" title="Enable Swaparr stalled download monitoring for this instance" target="_blank" rel="noopener"><i class="fas fa-info-circle"></i></a>Swaparr:</label>
                            <label class="toggle-switch" style="width:40px; height:20px; display:inline-block; position:relative;">
                                <input type="checkbox" id="readarr-swaparr-${index}" name="swaparr_enabled" ${
                                instance.swaparr_enabled === true
                                  ? "checked"
                                  : ""
                              }>
                                <span class="toggle-slider" style="position:absolute; cursor:pointer; top:0; left:0; right:0; bottom:0; background-color:#3d4353; border-radius:20px; transition:0.4s;"></span>
                            </label>
                            <p class="setting-help">Enable Swaparr to monitor and remove stalled downloads for this Readarr instance</p>
                        </div>`
                            : ""
                        }
                    </div>
                </div>
            `;
    });

    instancesHtml += `
                </div> <!-- instances-container -->
                <div class="button-container" style="text-align: center; margin-top: 15px;">
                    <button type="button" class="add-instance-btn add-readarr-instance-btn">
                        <i class="fas fa-plus"></i> Add Readarr Instance (${settings.instances.length}/9)
                    </button>
                </div>
            </div> <!-- settings-group -->
        `;

    // Continue with the rest of the settings form
    container.innerHTML = `
            ${readarrSaveButtonHtml}
            ${instancesHtml}
            
            <div class="settings-group">
                <h3>Search Settings</h3>

                <div class="setting-item">
                    <label for="readarr_sleep_duration"><a href="https://plexguide.github.io/Huntarr.io/apps/readarr.html#search-settings" class="info-icon" title="Learn more about sleep duration" target="_blank" rel="noopener"><i class="fas fa-info-circle"></i></a>Sleep Duration (Minutes):</label>
                    <input type="number" id="readarr_sleep_duration" name="sleep_duration" min="10" value="${
                      settings.sleep_duration !== undefined
                        ? Math.round(settings.sleep_duration / 60)
                        : 15
                    }">
                    <p class="setting-help">Time in minutes between processing cycles (minimum 10 minutes)</p>
                </div>
                <div class="setting-item">
                    <label for="readarr_hourly_cap"><a href="https://plexguide.github.io/Huntarr.io/apps/readarr.html#search-settings" class="info-icon" title="Maximum API requests per hour for this app (20 is safe)" target="_blank" rel="noopener"><i class="fas fa-info-circle"></i></a>API Cap - Hourly:</label>
                    <input type="number" id="readarr_hourly_cap" name="hourly_cap" min="1" max="400" value="${
                      settings.hourly_cap !== undefined
                        ? settings.hourly_cap
                        : 20
                    }">
                    <p class="setting-help">Maximum API requests per hour to prevent being banned by your indexers. Keep lower for safety (20-50 recommended). Max allowed: 400.</p>
                </div>
            </div>
            
            <div class="settings-group" id="readarr-custom-tags">
                <h3>Custom Tags</h3>
                <div class="setting-item">
                    <label for="readarr_tag_processed_items"><a href="https://github.com/plexguide/Huntarr.io/issues/382" class="info-icon" title="Learn more about tagging processed items" target="_blank" rel="noopener"><i class="fas fa-info-circle"></i></a>Tag Processed Items:</label>
                    <label class="toggle-switch" style="width:40px; height:20px; display:inline-block; position:relative;">
                        <input type="checkbox" id="readarr_tag_processed_items" name="tag_processed_items" ${
                          settings.tag_processed_items !== false
                            ? "checked"
                            : ""
                        }>
                        <span class="toggle-slider" style="position:absolute; cursor:pointer; top:0; left:0; right:0; bottom:0; background-color:#3d4353; border-radius:20px; transition:0.4s;"></span>
                    </label>
                    <p class="setting-help">Enable custom tagging for processed items</p>
                </div>
                <div class="setting-item" id="readarr-custom-tag-fields" style="display: ${
                  settings.tag_processed_items !== false ? "block" : "none"
                };">
                    <label for="readarr_custom_tag_missing"><a href="https://github.com/plexguide/Huntarr.io/issues/579" class="info-icon" title="Customize the tag applied to missing items" target="_blank" rel="noopener"><i class="fas fa-info-circle"></i></a>Missing Books Tag:</label>
                    <input type="text" id="readarr_custom_tag_missing" name="custom_tag_missing" maxlength="25" value="${
                      settings.custom_tags?.missing || "huntarr-missing"
                    }" placeholder="huntarr-missing">
                    <p class="setting-help">Custom tag for missing books (max 25 characters)</p>
                </div>
                <div class="setting-item" id="readarr-custom-tag-fields-2" style="display: ${
                  settings.tag_processed_items !== false ? "block" : "none"
                };">
                    <label for="readarr_custom_tag_upgrade"><a href="https://github.com/plexguide/Huntarr.io/issues/579" class="info-icon" title="Customize the tag applied to upgraded items" target="_blank" rel="noopener"><i class="fas fa-info-circle"></i></a>Upgrade Books Tag:</label>
                    <input type="text" id="readarr_custom_tag_upgrade" name="custom_tag_upgrade" maxlength="25" value="${
                      settings.custom_tags?.upgrade || "huntarr-upgrade"
                    }" placeholder="huntarr-upgrade">
                    <p class="setting-help">Custom tag for upgraded books (max 25 characters)</p>
                </div>
            </div>
            
            <div class="settings-group">
                <h3>Additional Options</h3>
                <div class="setting-item">
                    <label for="readarr_monitored_only"><a href="https://plexguide.github.io/Huntarr.io/apps/readarr.html#monitored-only" class="info-icon" title="Learn more about monitored only option" target="_blank" rel="noopener"><i class="fas fa-info-circle"></i></a>Monitored Only:</label>
                    <label class="toggle-switch" style="width:40px; height:20px; display:inline-block; position:relative;">
                        <input type="checkbox" id="readarr_monitored_only" name="monitored_only" ${
                          settings.monitored_only !== false ? "checked" : ""
                        }>
                        <span class="toggle-slider" style="position:absolute; cursor:pointer; top:0; left:0; right:0; bottom:0; background-color:#3d4353; border-radius:20px; transition:0.4s;"></span>
                    </label>
                    <p class="setting-help">Only search for monitored items</p>
                </div>
                <div class="setting-item">
                    <label for="readarr_skip_future_releases"><a href="https://plexguide.github.io/Huntarr.io/apps/readarr.html#skip-future-releases" class="info-icon" title="Learn more about skipping future releases" target="_blank" rel="noopener"><i class="fas fa-info-circle"></i></a>Skip Future Releases:</label>
                    <label class="toggle-switch" style="width:40px; height:20px; display:inline-block; position:relative;">
                        <input type="checkbox" id="readarr_skip_future_releases" name="skip_future_releases" ${
                          settings.skip_future_releases !== false
                            ? "checked"
                            : ""
                        }>
                        <span class="toggle-slider" style="position:absolute; cursor:pointer; top:0; left:0; right:0; bottom:0; background-color:#3d4353; border-radius:20px; transition:0.4s;"></span>
                    </label>
                    <p class="setting-help">Skip searching for books with future release dates</p>
                </div>
            </div>
        `;

    // Add event listeners for the instance management
    SettingsForms.setupInstanceManagement(
      container,
      "readarr",
      (settings.instances || []).length
    );

    // Set up manual save functionality for Readarr
    this.setupAppManualSave(container, "readarr", settings);

    // Load state information for each instance
    settings.instances.forEach((instance, index) => {
      if (typeof huntarrUI !== "undefined" && huntarrUI.loadInstanceStateInfo) {
        setTimeout(() => {
          huntarrUI.loadInstanceStateInfo("readarr", index);
        }, 500); // Small delay to ensure DOM is ready
      }
    });

    // Add event listeners for custom tags visibility
    const readarrTagProcessedItemsToggle = container.querySelector(
      "#readarr_tag_processed_items"
    );
    const readarrCustomTagFields = [
      container.querySelector("#readarr-custom-tag-fields"),
      container.querySelector("#readarr-custom-tag-fields-2"),
    ];

    if (readarrTagProcessedItemsToggle) {
      readarrTagProcessedItemsToggle.addEventListener("change", function () {
        readarrCustomTagFields.forEach((field) => {
          if (field) {
            field.style.display = this.checked ? "block" : "none";
          }
        });
      });
    }
  },

  // Generate Whisparr settings form
  generateWhisparrForm: function (container, settings = {}) {
    // Temporarily suppress change detection during form generation
    const wasSuppressionActive = window._appsSuppressChangeDetection;
    window._appsSuppressChangeDetection = true;

    // Add data-app-type attribute to container
    container.setAttribute("data-app-type", "whisparr");

    // Make sure the instances array exists
    if (
      !settings.instances ||
      !Array.isArray(settings.instances) ||
      settings.instances.length === 0
    ) {
      settings.instances = [
        {
          name: "Default",
          api_url: "",
          api_key: "",
          enabled: true,
        },
      ];
    }

    // Add save button at the top
    let whisparrSaveButtonHtml = `
            <div style="margin-bottom: 20px;">
                <button type="button" id="whisparr-save-button" disabled style="
                    background: #6b7280;
                    color: #9ca3af;
                    border: 1px solid #4b5563;
                    padding: 8px 16px;
                    border-radius: 6px;
                    font-size: 14px;
                    font-weight: 500;
                    cursor: not-allowed;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    transition: all 0.2s ease;
                ">
                    <i class="fas fa-save"></i>
                    Save Changes
                </button>
            </div>
        `;

    // Create a container for instances
    let instancesHtml = `
            <div class="settings-group">
                <h3>Whisparr V2 Instances</h3>
                <div class="instances-container">
        `;

    // Generate form elements for each instance
    settings.instances.forEach((instance, index) => {
      instancesHtml += `
                <div class="instance-item" data-instance-id="${index}">
                                        <div class="instance-header">
                        <h4>Instance ${index + 1}: ${
        instance.name || "Unnamed"
      }</h4>
                        <div class="instance-actions">
                            ${
                              index > 0
                                ? '<button type="button" class="remove-instance-btn">Remove</button>'
                                : ""
                            }
                            <span class="connection-status" id="whisparr-status-${index}" style="margin-left: 10px; font-weight: bold; font-size: 0.9em;"></span>
                        </div>
                    </div>
                    <div class="instance-content">
                        <div class="setting-item">
                            <label for="whisparr-enabled-${index}"><a href="https://plexguide.github.io/Huntarr.io/apps/whisparr.html#connection-settings" class="info-icon" title="Learn more about enabling/disabling instances" target="_blank" rel="noopener"><i class="fas fa-info-circle"></i></a>Enabled:</label>
                            <label class="toggle-switch" style="width:40px; height:20px; display:inline-block; position:relative;">
                                <input type="checkbox" id="whisparr-enabled-${index}" name="enabled" ${
        instance.enabled !== false ? "checked" : ""
      }>
                                <span class="toggle-slider" style="position:absolute; cursor:pointer; top:0; left:0; right:0; bottom:0; background-color:#3d4353; border-radius:20px; transition:0.4s;"></span>
                            </label>
                            <p class="setting-help">Enable or disable this Whisparr V2 instance for processing</p>
                        </div>
                        <div class="setting-item">
                                            <label for="whisparr-name-${index}"><a href="https://plexguide.github.io/Huntarr.io/apps/whisparr.html#connection-settings" class="info-icon" title="Learn more about naming your Whisparr instance" target="_blank" rel="noopener"><i class="fas fa-info-circle"></i></a>Name:</label>
                <input type="text" id="whisparr-name-${index}" name="name" value="${
        instance.name || ""
      }" placeholder="Friendly name for this Whisparr V2 instance">
                <p class="setting-help">Friendly name for this Whisparr V2 instance</p>
                </div>
                <div class="setting-item">
                <label for="whisparr-url-${index}"><a href="https://plexguide.github.io/Huntarr.io/apps/whisparr.html#connection-settings" class="info-icon" title="Learn more about Whisparr URL configuration" target="_blank" rel="noopener"><i class="fas fa-info-circle"></i></a>URL:</label>
                                            <input type="text" id="whisparr-url-${index}" name="api_url" value="${
        instance.api_url || ""
      }" placeholder="Base URL for Whisparr V2 (e.g., http://localhost:6969)" data-instance-index="${index}">
                <p class="setting-help">Base URL for Whisparr V2 (e.g., http://localhost:6969)</p>
                </div>
                <div class="setting-item">
                <label for="whisparr-key-${index}"><a href="https://plexguide.github.io/Huntarr.io/apps/whisparr.html#connection-settings" class="info-icon" title="Learn more about finding your Whisparr API key" target="_blank" rel="noopener"><i class="fas fa-info-circle"></i></a>API Key:</label>
                                            <input type="text" id="whisparr-key-${index}" name="api_key" value="${
        instance.api_key || ""
      }" placeholder="API key for Whisparr V2" data-instance-index="${index}">
                <p class="setting-help">API key for Whisparr V2</p>
                </div>
                        <div class="setting-item">
                            <label for="whisparr-hunt-missing-items-${index}"><a href="https://plexguide.github.io/Huntarr.io/apps/whisparr.html#search-settings" class="info-icon" title="Learn more about missing items search for this instance" target="_blank" rel="noopener"><i class="fas fa-info-circle"></i></a>Missing Search:</label>
                            <input type="number" id="whisparr-hunt-missing-items-${index}" name="hunt_missing_items" min="0" value="${
        instance.hunt_missing_items !== undefined
          ? instance.hunt_missing_items
          : 1
      }" style="width: 80px;">
                            <p class="setting-help">Number of missing items to search per cycle (0 to disable).</p>
                        </div>
                        <div class="setting-item">
                            <label for="whisparr-hunt-upgrade-items-${index}"><a href="https://plexguide.github.io/Huntarr.io/apps/whisparr.html#search-settings" class="info-icon" title="Learn more about upgrade items search for this instance" target="_blank" rel="noopener"><i class="fas fa-info-circle"></i></a>Upgrade Search:</label>
                            <input type="number" id="whisparr-hunt-upgrade-items-${index}" name="hunt_upgrade_items" min="0" value="${
        instance.hunt_upgrade_items !== undefined
          ? instance.hunt_upgrade_items
          : 0
      }" style="width: 80px;">
                            <p class="setting-help">Number of items to upgrade per cycle (0 to disable).</p>
                        </div>
                        
                        <!-- Instance State Management -->
                        <div class="setting-item" style="border-top: 1px solid rgba(90, 109, 137, 0.2); padding-top: 15px; margin-top: 15px;">
                            <label for="whisparr-state-management-mode-${index}"><a href="https://plexguide.github.io/Huntarr.io/settings/settings.html#state-reset-hours" class="info-icon" title="Configure state management for this instance" target="_blank" rel="noopener"><i class="fas fa-database"></i></a>State Management:</label>
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <select id="whisparr-state-management-mode-${index}" name="state_management_mode" style="width: 150px; padding: 8px 12px; border-radius: 6px; cursor: pointer; border: 1px solid rgba(255, 255, 255, 0.1); background-color: #1f2937; color: #d1d5db;">
                                    <option value="custom" ${
                                      (instance.state_management_mode ||
                                        "custom") === "custom"
                                        ? "selected"
                                        : ""
                                    }>Enabled</option>
                                    <option value="disabled" ${
                                      (instance.state_management_mode ||
                                        "custom") === "disabled"
                                        ? "selected"
                                        : ""
                                    }>Disabled</option>
                                </select>
                                <button type="button" id="whisparr-state-reset-btn-${index}" class="btn btn-danger" style="display: ${
        (instance.state_management_mode || "custom") !== "disabled"
          ? "inline-flex"
          : "none"
      }; background: linear-gradient(145deg, rgba(231, 76, 60, 0.2), rgba(192, 57, 43, 0.15)); color: rgba(231, 76, 60, 0.9); border: 1px solid rgba(231, 76, 60, 0.3); padding: 6px 12px; border-radius: 6px; font-size: 12px; align-items: center; gap: 4px; cursor: pointer; transition: all 0.2s ease;">
                                    <i class="fas fa-redo"></i> Reset State
                                </button>
                            </div>
                            <p class="setting-help">Enable state management to track processed media and prevent reprocessing</p>
                        </div>
                        
                        <!-- State Management Hours (visible when enabled) -->
                        <div class="setting-item" id="whisparr-custom-state-hours-${index}" style="display: ${
        (instance.state_management_mode || "custom") === "custom"
          ? "block"
          : "none"
      }; margin-left: 20px; padding: 12px; background: linear-gradient(145deg, rgba(30, 39, 56, 0.3), rgba(22, 28, 40, 0.4)); border: 1px solid rgba(90, 109, 137, 0.15); border-radius: 8px;">
                            <label for="whisparr-state-management-hours-${index}" style="display: flex; align-items: center; gap: 8px;">
                                <i class="fas fa-clock" style="color: #6366f1;"></i>
                                Reset Interval:
                            </label>
                            <div style="display: flex; align-items: center; gap: 10px; margin-top: 8px;">
                                <input type="number" id="whisparr-state-management-hours-${index}" name="state_management_hours" min="1" max="8760" value="${
        instance.state_management_hours || 168
      }" style="width: 80px; padding: 8px 12px; border-radius: 4px; border: 1px solid rgba(255, 255, 255, 0.1); background-color: #374151; color: #d1d5db;">
                                <span style="color: #9ca3af; font-size: 14px;">
                                    hours (<span id="whisparr-state-days-display-${index}">${(
        (instance.state_management_hours || 168) / 24
      ).toFixed(1)}</span> days)
                                </span>
                            </div>
                            <p class="setting-help" style="font-size: 13px; color: #9ca3af; margin-top: 8px;">
                                <i class="fas fa-info-circle" style="margin-right: 4px;"></i>
                                State will automatically reset every <span id="whisparr-state-hours-text-${index}">${
        instance.state_management_hours || 168
      }</span> hours
                            </p>
                        </div>
                        
                        <!-- State Status Display -->
                        <div class="setting-item" id="whisparr-state-status-${index}" style="display: ${
        (instance.state_management_mode || "custom") !== "disabled"
          ? "block"
          : "none"
      }; margin-left: 20px; padding: 10px; background: linear-gradient(145deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.05)); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 6px;">
                            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 13px;">
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <span style="color: #10b981; font-weight: 600;">
                                        <i class="fas fa-check-circle" style="margin-right: 4px;"></i>
                                        Active - Tracked Items: <span id="whisparr-state-items-count-${index}">0</span>
                                    </span>
                                </div>
                                <div style="text-align: right;">
                                    <div style="color: #9ca3af; font-size: 12px;">Next Reset:</div>
                                    <div id="whisparr-state-reset-time-${index}" style="color: #d1d5db; font-weight: 500;">Calculating...</div>
                                </div>
                            </div>
                        </div>
                        
                        ${
                          this.isSwaparrGloballyEnabled()
                            ? `<div class="setting-item">
                            <label for="whisparr-swaparr-${index}"><a href="https://plexguide.github.io/Huntarr.io/apps/swaparr.html" class="info-icon" title="Enable Swaparr stalled download monitoring for this instance" target="_blank" rel="noopener"><i class="fas fa-info-circle"></i></a>Swaparr:</label>
                            <label class="toggle-switch" style="width:40px; height:20px; display:inline-block; position:relative;">
                                <input type="checkbox" id="whisparr-swaparr-${index}" name="swaparr_enabled" ${
                                instance.swaparr_enabled === true
                                  ? "checked"
                                  : ""
                              }>
                                <span class="toggle-slider" style="position:absolute; cursor:pointer; top:0; left:0; right:0; bottom:0; background-color:#3d4353; border-radius:20px; transition:0.4s;"></span>
                            </label>
                            <p class="setting-help">Enable Swaparr to monitor and remove stalled downloads for this Whisparr V2 instance</p>
                        </div>`
                            : ""
                        }
                    </div>
                </div>
            `;
    });

    instancesHtml += `
                </div> <!-- instances-container -->
                <div class="button-container" style="text-align: center; margin-top: 15px;">
                    <button type="button" class="add-instance-btn add-whisparr-instance-btn">
                        <i class="fas fa-plus"></i> Add Whisparr V2 Instance (${settings.instances.length}/9)
                    </button>
                </div>
            </div> <!-- settings-group -->
        `;

    // Search Settings
    let searchSettingsHtml = `
            <div class="settings-group">
                <h3>Search Settings</h3>
                
                <div class="setting-item">
                <label for="whisparr_sleep_duration"><a href="https://plexguide.github.io/Huntarr.io/apps/whisparr.html#search-settings" class="info-icon" title="Learn more about sleep duration" target="_blank" rel="noopener"><i class="fas fa-info-circle"></i></a>Sleep Duration (Minutes):</label>
                                    <input type="number" id="whisparr_sleep_duration" name="sleep_duration" min="10" value="${
                                      settings.sleep_duration !== undefined
                                        ? Math.round(
                                            settings.sleep_duration / 60
                                          )
                                        : 15
                                    }">
                    <p class="setting-help">Time in minutes between processing cycles (minimum 10 minutes)</p>
                </div>
                <div class="setting-item">
                    <label for="whisparr_hourly_cap"><a href="https://plexguide.github.io/Huntarr.io/apps/whisparr.html#search-settings" class="info-icon" title="Maximum API requests per hour for this app (20 is safe)" target="_blank" rel="noopener"><i class="fas fa-info-circle"></i></a>API Cap - Hourly:</label>
                    <input type="number" id="whisparr_hourly_cap" name="hourly_cap" min="1" max="400" value="${
                      settings.hourly_cap !== undefined
                        ? settings.hourly_cap
                        : 20
                    }">
                    <p class="setting-help">Maximum API requests per hour to prevent being banned by your indexers. Keep lower for safety (20-50 recommended). Max allowed: 400.</p>
                </div>
            </div>
            
            <div class="settings-group" id="whisparr-custom-tags">
                <h3>Custom Tags</h3>
                <div class="setting-item">
                    <label for="whisparr_tag_processed_items"><a href="https://github.com/plexguide/Huntarr.io/issues/382" class="info-icon" title="Learn more about tagging processed items" target="_blank" rel="noopener"><i class="fas fa-info-circle"></i></a>Tag Processed Items:</label>
                    <label class="toggle-switch" style="width:40px; height:20px; display:inline-block; position:relative;">
                        <input type="checkbox" id="whisparr_tag_processed_items" name="tag_processed_items" ${
                          settings.tag_processed_items !== false
                            ? "checked"
                            : ""
                        }>
                        <span class="toggle-slider" style="position:absolute; cursor:pointer; top:0; left:0; right:0; bottom:0; background-color:#3d4353; border-radius:20px; transition:0.4s;"></span>
                    </label>
                    <p class="setting-help">Enable custom tagging for processed items</p>
                </div>
                <div class="setting-item" id="whisparr-custom-tag-fields" style="display: ${
                  settings.tag_processed_items !== false ? "block" : "none"
                };">
                    <label for="whisparr_custom_tag_missing"><a href="https://github.com/plexguide/Huntarr.io/issues/579" class="info-icon" title="Customize the tag applied to missing items" target="_blank" rel="noopener"><i class="fas fa-info-circle"></i></a>Missing Movies Tag:</label>
                    <input type="text" id="whisparr_custom_tag_missing" name="custom_tag_missing" maxlength="25" value="${
                      settings.custom_tags?.missing || "huntarr-missing"
                    }" placeholder="huntarr-missing">
                    <p class="setting-help">Custom tag for missing movies (max 25 characters)</p>
                </div>
                <div class="setting-item" id="whisparr-custom-tag-fields-2" style="display: ${
                  settings.tag_processed_items !== false ? "block" : "none"
                };">
                    <label for="whisparr_custom_tag_upgrade"><a href="https://github.com/plexguide/Huntarr.io/issues/579" class="info-icon" title="Customize the tag applied to upgraded items" target="_blank" rel="noopener"><i class="fas fa-info-circle"></i></a>Upgrade Movies Tag:</label>
                    <input type="text" id="whisparr_custom_tag_upgrade" name="custom_tag_upgrade" maxlength="25" value="${
                      settings.custom_tags?.upgrade || "huntarr-upgrade"
                    }" placeholder="huntarr-upgrade">
                    <p class="setting-help">Custom tag for upgraded movies (max 25 characters)</p>
                </div>
            </div>
            
            <div class="settings-group">
                <h3>Additional Options</h3>
                <div class="setting-item">
                    <label for="whisparr_monitored_only"><a href="https://plexguide.github.io/Huntarr.io/apps/whisparr.html#additional-options" class="info-icon" title="Learn more about monitored only option" target="_blank" rel="noopener"><i class="fas fa-info-circle"></i></a>Monitored Only:</label>
                    <label class="toggle-switch" style="width:40px; height:20px; display:inline-block; position:relative;">
                        <input type="checkbox" id="whisparr_monitored_only" name="monitored_only" ${
                          settings.monitored_only !== false ? "checked" : ""
                        }>
                        <span class="toggle-slider" style="position:absolute; cursor:pointer; top:0; left:0; right:0; bottom:0; background-color:#3d4353; border-radius:20px; transition:0.4s;"></span>
                    </label>
                    <p class="setting-help">Only search for monitored items</p>
                </div>
                <div class="setting-item">
                    <label for="whisparr_skip_future_releases"><a href="https://plexguide.github.io/Huntarr.io/apps/whisparr.html#additional-options" class="info-icon" title="Learn more about skipping future releases" target="_blank" rel="noopener"><i class="fas fa-info-circle"></i></a>Skip Future Releases:</label>
                    <label class="toggle-switch" style="width:40px; height:20px; display:inline-block; position:relative;">
                        <input type="checkbox" id="whisparr_skip_future_releases" name="skip_future_releases" ${
                          settings.skip_future_releases !== false
                            ? "checked"
                            : ""
                        }>
                        <span class="toggle-slider" style="position:absolute; cursor:pointer; top:0; left:0; right:0; bottom:0; background-color:#3d4353; border-radius:20px; transition:0.4s;"></span>
                    </label>
                    <p class="setting-help">Skip searching for scenes with future release dates</p>
                </div>
            </div>
        `;

    // Set the content with save button at the top
    container.innerHTML =
      whisparrSaveButtonHtml + instancesHtml + searchSettingsHtml;

    // Add event listeners for the instance management
    this.setupInstanceManagement(
      container,
      "whisparr",
      (settings.instances || []).length
    );

    // Set up manual save functionality for Whisparr
    this.setupAppManualSave(container, "whisparr", settings);

    // Load state information for each instance
    settings.instances.forEach((instance, index) => {
      if (typeof huntarrUI !== "undefined" && huntarrUI.loadInstanceStateInfo) {
        setTimeout(() => {
          huntarrUI.loadInstanceStateInfo("whisparr", index);
        }, 500); // Small delay to ensure DOM is ready
      }
    });

    // Add event listeners for state management
    settings.instances.forEach((instance, index) => {
      // State management mode change listeners
      const stateManagementModeSelect = container.querySelector(
        `#whisparr-state-management-mode-${index}`
      );
      const customStateHours = container.querySelector(
        `#whisparr-custom-state-hours-${index}`
      );
      const stateStatus = container.querySelector(
        `#whisparr-state-status-${index}`
      );
      const stateResetBtn = container.querySelector(
        `#whisparr-state-reset-btn-${index}`
      );

      if (stateManagementModeSelect) {
        stateManagementModeSelect.addEventListener("change", function () {
          const mode = this.value;

          // Show/hide hours and status sections
          if (customStateHours) {
            customStateHours.style.display =
              mode === "custom" ? "block" : "none";
          }

          if (stateStatus) {
            stateStatus.style.display = mode !== "disabled" ? "block" : "none";
          }

          if (stateResetBtn) {
            stateResetBtn.style.display =
              mode !== "disabled" ? "inline-flex" : "none";
          }
        });
      }

      // Reset button functionality
      if (stateResetBtn) {
        stateResetBtn.addEventListener("click", function () {
          if (
            confirm(
              "Are you sure you want to reset the state for this instance? This will clear all tracked processed media IDs and allow them to be reprocessed."
            )
          ) {
            SettingsForms.resetInstanceState("whisparr", index);
          }
        });
      }

      // Custom hours input change listener
      const stateHoursInput = container.querySelector(
        `#whisparr-state-management-hours-${index}`
      );
      const stateDaysDisplay = container.querySelector(
        `#whisparr-state-days-display-${index}`
      );
      const stateHoursText = container.querySelector(
        `#whisparr-state-hours-text-${index}`
      );

      if (stateHoursInput) {
        stateHoursInput.addEventListener("input", function () {
          const hours = parseInt(this.value) || 168;
          const days = (hours / 24).toFixed(1);

          if (stateDaysDisplay) {
            stateDaysDisplay.textContent = days;
          }

          if (stateHoursText) {
            stateHoursText.textContent = hours;
          }

          // Don't calculate reset time here - let the server provide the locked time
          // The reset time should come from the database lock, not be calculated from current time
        });
      }
    });

    // Add event listeners for custom tags visibility
    const whisparrTagProcessedItemsToggle = container.querySelector(
      "#whisparr_tag_processed_items"
    );
    const whisparrCustomTagFields = [
      container.querySelector("#whisparr-custom-tag-fields"),
      container.querySelector("#whisparr-custom-tag-fields-2"),
    ];

    if (whisparrTagProcessedItemsToggle) {
      whisparrTagProcessedItemsToggle.addEventListener("change", function () {
        whisparrCustomTagFields.forEach((field) => {
          if (field) {
            field.style.display = this.checked ? "block" : "none";
          }
        });
      });
    }

    // Update duration display
    this.updateDurationDisplay();

    // Restore the original suppression state after a brief delay to allow form to fully render
    setTimeout(() => {
      window._appsSuppressChangeDetection = wasSuppressionActive;
      console.log(
        `[SettingsForms] Restored change detection suppression state for Whisparr: ${wasSuppressionActive}`
      );
    }, 100);
  },

  // Generate Eros settings form
  generateErosForm: function (container, settings = {}) {
    // Temporarily suppress change detection during form generation
    const wasSuppressionActive = window._appsSuppressChangeDetection;
    window._appsSuppressChangeDetection = true;

    // Add data-app-type attribute to container
    container.setAttribute("data-app-type", "eros");

    // Make sure the instances array exists
    if (
      !settings.instances ||
      !Array.isArray(settings.instances) ||
      settings.instances.length === 0
    ) {
      settings.instances = [
        {
          name: "Default",
          api_url: "",
          api_key: "",
          enabled: true,
        },
      ];
    }

    // Add save button at the top
    let erosSaveButtonHtml = `
            <div style="margin-bottom: 20px;">
                <button type="button" id="eros-save-button" disabled style="
                    background: #6b7280;
                    color: #9ca3af;
                    border: 1px solid #4b5563;
                    padding: 8px 16px;
                    border-radius: 6px;
                    font-size: 14px;
                    font-weight: 500;
                    cursor: not-allowed;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    transition: all 0.2s ease;
                ">
                    <i class="fas fa-save"></i>
                    Save Changes
                </button>
            </div>
        `;

    // Create a container for instances
    let instancesHtml = `
            <div class="settings-group">
                <h3>Whisparr V3 Instances</h3>
                <div class="instances-container">
        `;

    // Generate form elements for each instance
    settings.instances.forEach((instance, index) => {
      instancesHtml += `
                <div class="instance-item" data-instance-id="${index}">
                    <div class="instance-header">
                        <h4>Instance ${index + 1}: ${
        instance.name || "Unnamed"
      }</h4>
                        <div class="instance-actions">
                            ${
                              index > 0
                                ? '<button type="button" class="remove-instance-btn">Remove</button>'
                                : ""
                            }
                            <span class="connection-status" id="eros-status-${index}" style="margin-left: 10px; font-weight: bold; font-size: 0.9em;"></span>
                        </div>
                    </div>
                    <div class="instance-content">
                        <div class="setting-item">
                            <label for="eros-enabled-${index}"><a href="https://plexguide.github.io/Huntarr.io/apps/eros.html#instance-enabled" class="info-icon" title="Learn more about enabling/disabling instances" target="_blank" rel="noopener"><i class="fas fa-info-circle"></i></a>Enabled:</label>
                            <label class="toggle-switch" style="width:40px; height:20px; display:inline-block; position:relative;">
                                <input type="checkbox" id="eros-enabled-${index}" name="enabled" ${
        instance.enabled !== false ? "checked" : ""
      }>
                                <span class="toggle-slider" style="position:absolute; cursor:pointer; top:0; left:0; right:0; bottom:0; background-color:#3d4353; border-radius:20px; transition:0.4s;"></span>
                            </label>
                            <p class="setting-help">Enable or disable this Whisparr V3 instance for processing</p>
                        </div>
                        <div class="setting-item">
                                            <label for="eros-name-${index}"><a href="https://plexguide.github.io/Huntarr.io/apps/eros.html#instance-name" class="info-icon" title="Learn more about naming your Whisparr V3 instance" target="_blank" rel="noopener"><i class="fas fa-info-circle"></i></a>Name:</label>
                <input type="text" id="eros-name-${index}" name="name" value="${
        instance.name || ""
      }" placeholder="Friendly name for this Whisparr V3 (Eros) instance">
                <p class="setting-help">Friendly name for this Whisparr V3 (Eros) instance</p>
                        </div>
                        <div class="setting-item">
                                            <label for="eros-url-${index}"><a href="https://plexguide.github.io/Huntarr.io/apps/eros.html#instance-url" class="info-icon" title="Learn more about Whisparr V3 (Eros) URL configuration" target="_blank" rel="noopener"><i class="fas fa-info-circle"></i></a>URL:</label>
                <input type="text" id="eros-url-${index}" name="api_url" value="${
        instance.api_url || ""
      }" placeholder="Base URL for Whisparr V3 (Eros) (e.g., http://localhost:6969)" data-instance-index="${index}">
                <p class="setting-help">Base URL for Whisparr V3 (Eros) (e.g., http://localhost:6969)</p>
                        </div>
                        <div class="setting-item">
                                            <label for="eros-key-${index}"><a href="https://plexguide.github.io/Huntarr.io/apps/eros.html#instance-api-key" class="info-icon" title="Learn more about finding your Whisparr V3 (Eros) API key" target="_blank" rel="noopener"><i class="fas fa-info-circle"></i></a>API Key:</label>
                <input type="text" id="eros-key-${index}" name="api_key" value="${
        instance.api_key || ""
      }" placeholder="API key for Whisparr V3 (Eros)" data-instance-index="${index}">
                <p class="setting-help">API key for Whisparr V3 (Eros)</p>
                        </div>
                        <div class="setting-item">
                            <label for="eros-hunt-missing-items-${index}"><a href="https://plexguide.github.io/Huntarr.io/apps/eros.html#missing-search" class="info-icon" title="Learn more about missing items search for this instance" target="_blank" rel="noopener"><i class="fas fa-info-circle"></i></a>Missing Search:</label>
                            <input type="number" id="eros-hunt-missing-items-${index}" name="hunt_missing_items" min="0" value="${
        instance.hunt_missing_items !== undefined
          ? instance.hunt_missing_items
          : 1
      }" style="width: 80px;">
                            <p class="setting-help">Number of missing items to search per cycle (0 to disable).</p>
                        </div>
                        <div class="setting-item">
                            <label for="eros-hunt-upgrade-items-${index}"><a href="https://plexguide.github.io/Huntarr.io/apps/eros.html#upgrade-search" class="info-icon" title="Learn more about upgrade items search for this instance" target="_blank" rel="noopener"><i class="fas fa-info-circle"></i></a>Upgrade Search:</label>
                            <input type="number" id="eros-hunt-upgrade-items-${index}" name="hunt_upgrade_items" min="0" value="${
        instance.hunt_upgrade_items !== undefined
          ? instance.hunt_upgrade_items
          : 0
      }" style="width: 80px;">
                            <p class="setting-help">Number of items to upgrade per cycle (0 to disable).</p>
                        </div>
                        
                        <!-- Instance State Management -->
                        <div class="setting-item" style="border-top: 1px solid rgba(90, 109, 137, 0.2); padding-top: 15px; margin-top: 15px;">
                            <label for="eros-state-management-mode-${index}"><a href="https://plexguide.github.io/Huntarr.io/settings/settings.html#state-reset-hours" class="info-icon" title="Configure state management for this instance" target="_blank" rel="noopener"><i class="fas fa-database"></i></a>State Management:</label>
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <select id="eros-state-management-mode-${index}" name="state_management_mode" style="width: 150px; padding: 8px 12px; border-radius: 6px; cursor: pointer; border: 1px solid rgba(255, 255, 255, 0.1); background-color: #1f2937; color: #d1d5db;">
                                    <option value="custom" ${
                                      (instance.state_management_mode ||
                                        "custom") === "custom"
                                        ? "selected"
                                        : ""
                                    }>Enabled</option>
                                    <option value="disabled" ${
                                      (instance.state_management_mode ||
                                        "custom") === "disabled"
                                        ? "selected"
                                        : ""
                                    }>Disabled</option>
                                </select>
                                <button type="button" id="eros-state-reset-btn-${index}" class="btn btn-danger" style="display: ${
        (instance.state_management_mode || "custom") !== "disabled"
          ? "inline-flex"
          : "none"
      }; background: linear-gradient(145deg, rgba(231, 76, 60, 0.2), rgba(192, 57, 43, 0.15)); color: rgba(231, 76, 60, 0.9); border: 1px solid rgba(231, 76, 60, 0.3); padding: 6px 12px; border-radius: 6px; font-size: 12px; align-items: center; gap: 4px; cursor: pointer; transition: all 0.2s ease;">
                                    <i class="fas fa-redo"></i> Reset State
                                </button>
                            </div>
                            <p class="setting-help">Enable state management to track processed media and prevent reprocessing</p>
                        </div>
                        
                        <!-- State Management Hours (visible when enabled) -->
                        <div class="setting-item" id="eros-custom-state-hours-${index}" style="display: ${
        (instance.state_management_mode || "custom") === "custom"
          ? "block"
          : "none"
      }; margin-left: 20px; padding: 12px; background: linear-gradient(145deg, rgba(30, 39, 56, 0.3), rgba(22, 28, 40, 0.4)); border: 1px solid rgba(90, 109, 137, 0.15); border-radius: 8px;">
                            <label for="eros-state-management-hours-${index}" style="display: flex; align-items: center; gap: 8px;">
                                <i class="fas fa-clock" style="color: #6366f1;"></i>
                                Reset Interval:
                            </label>
                            <div style="display: flex; align-items: center; gap: 10px; margin-top: 8px;">
                                <input type="number" id="eros-state-management-hours-${index}" name="state_management_hours" min="1" max="8760" value="${
        instance.state_management_hours || 168
      }" style="width: 80px; padding: 8px 12px; border-radius: 4px; border: 1px solid rgba(255, 255, 255, 0.1); background-color: #374151; color: #d1d5db;">
                                <span style="color: #9ca3af; font-size: 14px;">
                                    hours (<span id="eros-state-days-display-${index}">${(
        (instance.state_management_hours || 168) / 24
      ).toFixed(1)}</span> days)
                                </span>
                            </div>
                            <p class="setting-help" style="font-size: 13px; color: #9ca3af; margin-top: 8px;">
                                <i class="fas fa-info-circle" style="margin-right: 4px;"></i>
                                State will automatically reset every <span id="eros-state-hours-text-${index}">${
        instance.state_management_hours || 168
      }</span> hours
                            </p>
                        </div>
                        
                        <!-- State Status Display -->
                        <div class="setting-item" id="eros-state-status-${index}" style="display: ${
        (instance.state_management_mode || "custom") !== "disabled"
          ? "block"
          : "none"
      }; margin-left: 20px; padding: 10px; background: linear-gradient(145deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.05)); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 6px;">
                            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 13px;">
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <span style="color: #10b981; font-weight: 600;">
                                        <i class="fas fa-check-circle" style="margin-right: 4px;"></i>
                                        Active - Tracked Items: <span id="eros-state-items-count-${index}">0</span>
                                    </span>
                                </div>
                                <div style="text-align: right;">
                                    <div style="color: #9ca3af; font-size: 12px;">Next Reset:</div>
                                    <div id="eros-state-reset-time-${index}" style="color: #d1d5db; font-weight: 500;">Calculating...</div>
                                </div>
                            </div>
                        </div>
                        
                        ${
                          this.isSwaparrGloballyEnabled()
                            ? `<div class="setting-item">
                            <label for="eros-swaparr-${index}"><a href="https://plexguide.github.io/Huntarr.io/apps/swaparr.html" class="info-icon" title="Enable Swaparr stalled download monitoring for this instance" target="_blank" rel="noopener"><i class="fas fa-info-circle"></i></a>Swaparr:</label>
                            <label class="toggle-switch" style="width:40px; height:20px; display:inline-block; position:relative;">
                                <input type="checkbox" id="eros-swaparr-${index}" name="swaparr_enabled" ${
                                instance.swaparr_enabled === true
                                  ? "checked"
                                  : ""
                              }>
                                <span class="toggle-slider" style="position:absolute; cursor:pointer; top:0; left:0; right:0; bottom:0; background-color:#3d4353; border-radius:20px; transition:0.4s;"></span>
                            </label>
                            <p class="setting-help">Enable Swaparr to monitor and remove stalled downloads for this Whisparr V3 instance</p>
                        </div>`
                            : ""
                        }
                    </div>
                </div>
            `;
    });

    instancesHtml += `
                </div> <!-- instances-container -->
                <div class="button-container" style="text-align: center; margin-top: 15px;">
                    <button type="button" class="add-instance-btn add-eros-instance-btn">
                        <i class="fas fa-plus"></i> Add Whisparr V3 Instance (${settings.instances.length}/9)
                    </button>
                </div>
            </div> <!-- settings-group -->
        `;

    // Search Mode dropdown
    let searchSettingsHtml = `
            <div class="settings-group">
                <h3>Search Settings</h3>
                <div class="setting-item">
                    <label for="eros_search_mode"><a href="https://plexguide.github.io/Huntarr.io/apps/eros.html#search-mode" class="info-icon" title="Learn more about search modes" target="_blank" rel="noopener"><i class="fas fa-info-circle"></i></a>Search Mode:</label>
                    <select id="eros_search_mode" name="search_mode">
                        <option value="movie" ${
                          settings.search_mode === "movie" ||
                          !settings.search_mode
                            ? "selected"
                            : ""
                        }>Movie</option>
                        <option value="scene" ${
                          settings.search_mode === "scene" ? "selected" : ""
                        }>Scene</option>
                    </select>
                    <p class="setting-help">How to search for missing and upgradable Whisparr V3 content (Movie-based or Scene-based)</p>
                </div>

                <div class="setting-item">
                    <label for="eros_sleep_duration"><a href="https://plexguide.github.io/Huntarr.io/apps/eros.html#sleep-duration" class="info-icon" title="Learn more about sleep duration" target="_blank" rel="noopener"><i class="fas fa-info-circle"></i></a>Sleep Duration (Minutes):</label>
                    <input type="number" id="eros_sleep_duration" name="sleep_duration" min="10" value="${
                      settings.sleep_duration !== undefined
                        ? Math.round(settings.sleep_duration / 60)
                        : 15
                    }">
                    <p class="setting-help">Time in minutes between processing cycles (minimum 10 minutes)</p>
                </div>
                <div class="setting-item">
                    <label for="eros_hourly_cap"><a href="https://plexguide.github.io/Huntarr.io/apps/eros.html#api-cap" class="info-icon" title="Maximum API requests per hour for this app (20 is safe)" target="_blank" rel="noopener"><i class="fas fa-info-circle"></i></a>API Cap - Hourly:</label>
                    <input type="number" id="eros_hourly_cap" name="hourly_cap" min="1" max="400" value="${
                      settings.hourly_cap !== undefined
                        ? settings.hourly_cap
                        : 20
                    }">
                    <p class="setting-help">Maximum API requests per hour to prevent being banned by your indexers. Keep lower for safety (20-50 recommended). Max allowed: 400.</p>
                </div>
            </div>
            
            <div class="settings-group" id="eros-custom-tags">
                <h3>Custom Tags</h3>
                <div class="setting-item">
                    <label for="eros_tag_processed_items"><a href="https://github.com/plexguide/Huntarr.io/issues/382" class="info-icon" title="Learn more about tagging processed items" target="_blank" rel="noopener"><i class="fas fa-info-circle"></i></a>Tag Processed Items:</label>
                    <label class="toggle-switch" style="width:40px; height:20px; display:inline-block; position:relative;">
                        <input type="checkbox" id="eros_tag_processed_items" name="tag_processed_items" ${
                          settings.tag_processed_items !== false
                            ? "checked"
                            : ""
                        }>
                        <span class="toggle-slider" style="position:absolute; cursor:pointer; top:0; left:0; right:0; bottom:0; background-color:#3d4353; border-radius:20px; transition:0.4s;"></span>
                    </label>
                    <p class="setting-help">Enable custom tagging for processed items</p>
                </div>
                <div class="setting-item" id="eros-custom-tag-fields" style="display: ${
                  settings.tag_processed_items !== false ? "block" : "none"
                };">
                    <label for="eros_custom_tag_missing"><a href="https://github.com/plexguide/Huntarr.io/issues/579" class="info-icon" title="Customize the tag applied to missing items" target="_blank" rel="noopener"><i class="fas fa-info-circle"></i></a>Missing Movies Tag:</label>
                    <input type="text" id="eros_custom_tag_missing" name="custom_tag_missing" maxlength="25" value="${
                      settings.custom_tags?.missing || "huntarr-missing"
                    }" placeholder="huntarr-missing">
                    <p class="setting-help">Custom tag for missing movies (max 25 characters)</p>
                </div>
                <div class="setting-item" id="eros-custom-tag-fields-2" style="display: ${
                  settings.tag_processed_items !== false ? "block" : "none"
                };">
                    <label for="eros_custom_tag_upgrade"><a href="https://github.com/plexguide/Huntarr.io/issues/579" class="info-icon" title="Customize the tag applied to upgraded items" target="_blank" rel="noopener"><i class="fas fa-info-circle"></i></a>Upgrade Movies Tag:</label>
                    <input type="text" id="eros_custom_tag_upgrade" name="custom_tag_upgrade" maxlength="25" value="${
                      settings.custom_tags?.upgrade || "huntarr-upgrade"
                    }" placeholder="huntarr-upgrade">
                    <p class="setting-help">Custom tag for upgraded movies (max 25 characters)</p>
                </div>
            </div>
            
            <div class="settings-group">
                <h3>Additional Options</h3>
                <div class="setting-item">
                    <label for="eros_monitored_only"><a href="https://plexguide.github.io/Huntarr.io/apps/eros.html#monitored-only" class="info-icon" title="Learn more about monitored only option" target="_blank" rel="noopener"><i class="fas fa-info-circle"></i></a>Monitored Only:</label>
                    <label class="toggle-switch" style="width:40px; height:20px; display:inline-block; position:relative;">
                        <input type="checkbox" id="eros_monitored_only" name="monitored_only" ${
                          settings.monitored_only !== false ? "checked" : ""
                        }>
                        <span class="toggle-slider" style="position:absolute; cursor:pointer; top:0; left:0; right:0; bottom:0; background-color:#3d4353; border-radius:20px; transition:0.4s;"></span>
                    </label>
                    <p class="setting-help">Only search for monitored items</p>
                </div>
                <div class="setting-item">
                    <label for="eros_skip_future_releases"><a href="https://plexguide.github.io/Huntarr.io/apps/eros.html#skip-future-releases" class="info-icon" title="Learn more about skipping future releases" target="_blank" rel="noopener"><i class="fas fa-info-circle"></i></a>Skip Future Releases:</label>
                    <label class="toggle-switch" style="width:40px; height:20px; display:inline-block; position:relative;">
                        <input type="checkbox" id="eros_skip_future_releases" name="skip_future_releases" ${
                          settings.skip_future_releases !== false
                            ? "checked"
                            : ""
                        }>
                        <span class="toggle-slider" style="position:absolute; cursor:pointer; top:0; left:0; right:0; bottom:0; background-color:#3d4353; border-radius:20px; transition:0.4s;"></span>
                    </label>
                    <p class="setting-help">Skip searching for scenes with future release dates</p>
                </div>
            </div>
        `;

    // Set the content with save button at the top
    container.innerHTML =
      erosSaveButtonHtml + instancesHtml + searchSettingsHtml;

    // Add event listeners for the instance management
    this.setupInstanceManagement(
      container,
      "eros",
      (settings.instances || []).length
    );

    // Set up manual save functionality for Eros
    this.setupAppManualSave(container, "eros", settings);

    // Load state information for each instance
    settings.instances.forEach((instance, index) => {
      if (typeof huntarrUI !== "undefined" && huntarrUI.loadInstanceStateInfo) {
        setTimeout(() => {
          huntarrUI.loadInstanceStateInfo("eros", index);
        }, 500); // Small delay to ensure DOM is ready
      }
    });

    // Add event listeners for state management
    settings.instances.forEach((instance, index) => {
      // State management mode change listeners
      const stateManagementModeSelect = container.querySelector(
        `#eros-state-management-mode-${index}`
      );
      const customStateHours = container.querySelector(
        `#eros-custom-state-hours-${index}`
      );
      const stateStatus = container.querySelector(
        `#eros-state-status-${index}`
      );
      const stateResetBtn = container.querySelector(
        `#eros-state-reset-btn-${index}`
      );

      if (stateManagementModeSelect) {
        stateManagementModeSelect.addEventListener("change", function () {
          const mode = this.value;

          // Show/hide hours and status sections
          if (customStateHours) {
            customStateHours.style.display =
              mode === "custom" ? "block" : "none";
          }

          if (stateStatus) {
            stateStatus.style.display = mode !== "disabled" ? "block" : "none";
          }

          if (stateResetBtn) {
            stateResetBtn.style.display =
              mode !== "disabled" ? "inline-flex" : "none";
          }
        });
      }

      // Reset button functionality
      if (stateResetBtn) {
        stateResetBtn.addEventListener("click", function () {
          if (
            confirm(
              "Are you sure you want to reset the state for this instance? This will clear all tracked processed media IDs and allow them to be reprocessed."
            )
          ) {
            SettingsForms.resetInstanceState("eros", index);
          }
        });
      }

      // Custom hours input change listener
      const stateHoursInput = container.querySelector(
        `#eros-state-management-hours-${index}`
      );
      const stateDaysDisplay = container.querySelector(
        `#eros-state-days-display-${index}`
      );
      const stateHoursText = container.querySelector(
        `#eros-state-hours-text-${index}`
      );

      if (stateHoursInput) {
        stateHoursInput.addEventListener("input", function () {
          const hours = parseInt(this.value) || 168;
          const days = (hours / 24).toFixed(1);

          if (stateDaysDisplay) {
            stateDaysDisplay.textContent = days;
          }

          if (stateHoursText) {
            stateHoursText.textContent = hours;
          }

          // Don't calculate reset time here - let the server provide the locked time
          // The reset time should come from the database lock, not be calculated from current time
        });
      }
    });

    // Add event listeners for custom tags visibility
    const erosTagProcessedItemsToggle = container.querySelector(
      "#eros_tag_processed_items"
    );
    const erosCustomTagFields = [
      container.querySelector("#eros-custom-tag-fields"),
      container.querySelector("#eros-custom-tag-fields-2"),
    ];

    if (erosTagProcessedItemsToggle) {
      erosTagProcessedItemsToggle.addEventListener("change", function () {
        erosCustomTagFields.forEach((field) => {
          if (field) {
            field.style.display = this.checked ? "block" : "none";
          }
        });
      });
    }

    // Update duration display
    this.updateDurationDisplay();

    // Restore the original suppression state after a brief delay to allow form to fully render
    setTimeout(() => {
      window._appsSuppressChangeDetection = wasSuppressionActive;
      console.log(
        `[SettingsForms] Restored change detection suppression state for Eros: ${wasSuppressionActive}`
      );
    }, 100);
  },

  // Generate Swaparr settings form
  generateSwaparrForm: function (container, settings = {}) {
    // Add data-app-type attribute to container
    container.setAttribute("data-app-type", "swaparr");

    const html = `
            <!-- Swaparr Save Button -->
            <div class="swaparr-save-container" style="margin-bottom: 20px;">
                <button id="swaparr-save-button" class="swaparr-save-btn" disabled style="
                    background: #6b7280;
                    color: #9ca3af;
                    border: 1px solid #4b5563;
                    padding: 8px 16px;
                    border-radius: 6px;
                    font-size: 14px;
                    font-weight: 500;
                    cursor: not-allowed;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    transition: all 0.2s ease;
                ">
                    <i class="fas fa-save"></i>
                    Save Changes
                </button>
            </div>
            
            <!-- Swaparr Developer Credit Section -->
            <div class="settings-group" style="margin-bottom: 20px;">
                <div class="swaparr-credit-section" style="
                    background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%);
                    border: 2px solid #00c2ce;
                    border-radius: 8px;
                    padding: 12px;
                    margin: 10px 0 15px 0;
                    box-shadow: 0 4px 12px rgba(0, 194, 206, 0.15);
                ">
                    <div style="
                        background: rgba(255, 255, 255, 0.05);
                        border-radius: 6px;
                        padding: 10px;
                        margin: 8px 0;
                        border-left: 3px solid #00c2ce;
                    ">
                        <p style="color: #e2e8f0; margin: 0 0 5px 0; font-size: 0.85em; line-height: 1.4;">
                            <strong>Developer:</strong> <a href="https://github.com/ThijmenGThN" target="_blank" rel="noopener" style="color: #00c2ce; text-decoration: none;">ThijmenGThN</a> • 
                            <strong>GitHub Stars:</strong> <span style="color: #fbbf24;">⭐ <span id="swaparr-stars-count">172</span></span> • 
                            <strong>Version:</strong> v0.10.0
                        </p>
                        <p style="color: #cbd5e1; margin: 0; font-size: 0.75em; line-height: 1.3; font-style: italic;">
                            <strong>Beta Notice:</strong> This is a rewritten implementation by Admin9705 for Huntarr integration. 
                            Please note that the original Swaparr project does not provide support for this Huntarr-specific implementation. 
                            For Huntarr-related issues, use Huntarr's support channels.
                        </p>
                    </div>
                    
                    <div style="text-align: center; margin: 8px 0;">
                        <a href="https://github.com/ThijmenGThN/swaparr" target="_blank" rel="noopener" style="
                            display: inline-block;
                            background: linear-gradient(90deg, #00c2ce 0%, #0891b2 100%);
                            color: white;
                            padding: 6px 12px;
                            border-radius: 5px;
                            text-decoration: none;
                            font-weight: 500;
                            font-size: 0.8em;
                            transition: all 0.3s ease;
                        " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                            <i class="fas fa-star" style="margin-right: 4px;"></i>
                            Star Swaparr Project
                        </a>
                    </div>
                </div>
                
                <!-- Advanced Options Notice -->
                <div style="
                    background: linear-gradient(135deg, #164e63 0%, #0e7490 50%, #0891b2 100%);
                    border: 1px solid #22d3ee;
                    border-radius: 6px;
                    padding: 10px;
                    margin: 10px 0 15px 0;
                    box-shadow: 0 2px 8px rgba(34, 211, 238, 0.1);
                ">
                    <p style="color: #e0f7fa; margin: 0; font-size: 0.8em; line-height: 1.4;">
                        <i class="fas fa-rocket" style="margin-right: 6px; color: #22d3ee;"></i>
                        <strong>Need Advanced Options?</strong> For enhanced control and features, we recommend 
                        <a href="https://github.com/flmorg/cleanuperr" target="_blank" rel="noopener" style="color: #fbbf24; text-decoration: none; font-weight: 600;">
                            <strong>Cleanuperr</strong>
                        </a> which offers more comprehensive management capabilities.
                    </p>
                </div>
            </div>
            
            <div class="settings-group" style="
                background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%);
                border: 2px solid rgba(90, 109, 137, 0.3);
                border-radius: 12px;
                padding: 20px;
                margin: 15px 0 25px 0;
                box-shadow: 0 4px 12px rgba(90, 109, 137, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1);
            ">
                <h3>Swaparr Configuration</h3>
                <p class="setting-help" style="margin-bottom: 20px; color: #9ca3af;">
                    Swaparr monitors your *arr applications' download queues and removes stalled downloads automatically.
                </p>
                
                <div class="setting-item">
                    <label for="swaparr_enabled">
                        <a href="https://plexguide.github.io/Huntarr.io/apps/swaparr.html#enable-swaparr" class="info-icon" title="Enable or disable Swaparr" target="_blank" rel="noopener">
                            <i class="fas fa-info-circle"></i>
                        </a>
                        Enable Swaparr:
                    </label>
                    <label class="toggle-switch" style="width:40px; height:20px; display:inline-block; position:relative;">
                        <input type="checkbox" id="swaparr_enabled" ${
                          settings.enabled === true ? "checked" : ""
                        }>
                        <span class="toggle-slider" style="position:absolute; cursor:pointer; top:0; left:0; right:0; bottom:0; background-color:#3d4353; border-radius:20px; transition:0.4s;"></span>
                    </label>
                    <p class="setting-help">Enable automatic removal of stalled downloads</p>
                </div>
                
                <div class="setting-item">
                    <label for="swaparr_max_strikes">
                        <a href="https://plexguide.github.io/Huntarr.io/apps/swaparr.html#max-strikes" class="info-icon" title="Number of strikes before removal" target="_blank" rel="noopener">
                            <i class="fas fa-info-circle"></i>
                        </a>
                        Max Strikes:
                    </label>
                    <input type="number" id="swaparr_max_strikes" min="1" max="10" value="${
                      settings.max_strikes || 3
                    }">
                    <p class="setting-help">Number of strikes a download gets before being removed (default: 3)</p>
                </div>
                
                <div class="setting-item">
                    <label for="swaparr_max_download_time">
                        <a href="https://plexguide.github.io/Huntarr.io/apps/swaparr.html#max-download-time" class="info-icon" title="Maximum time before considering download stalled" target="_blank" rel="noopener">
                            <i class="fas fa-info-circle"></i>
                        </a>
                        Max Download Time:
                    </label>
                    <input type="text" id="swaparr_max_download_time" value="${
                      settings.max_download_time || "2h"
                    }" placeholder="e.g., 2h, 120m, 7200s">
                    <p class="setting-help">Maximum time before considering a download stalled (examples: 2h, 120m, 7200s)</p>
                </div>
                
                <div class="setting-item">
                    <label for="swaparr_ignore_above_size">
                        <a href="https://plexguide.github.io/Huntarr.io/apps/swaparr.html#ignore-above-size" class="info-icon" title="Ignore downloads larger than this size" target="_blank" rel="noopener">
                            <i class="fas fa-info-circle"></i>
                        </a>
                        Ignore Above Size:
                    </label>
                    <input type="text" id="swaparr_ignore_above_size" value="${
                      settings.ignore_above_size || "25GB"
                    }" placeholder="e.g., 25GB, 10GB, 5000MB">
                    <p class="setting-help">Ignore downloads larger than this size (examples: 25GB, 10GB, 5000MB)</p>
                </div>
                
                <div class="setting-item">
                    <label for="swaparr_remove_from_client">
                        <a href="https://plexguide.github.io/Huntarr.io/apps/swaparr.html#remove-from-client" class="info-icon" title="Remove downloads from download client" target="_blank" rel="noopener">
                            <i class="fas fa-info-circle"></i>
                        </a>
                        Remove from Client:
                    </label>
                    <label class="toggle-switch" style="width:40px; height:20px; display:inline-block; position:relative;">
                        <input type="checkbox" id="swaparr_remove_from_client" ${
                          settings.remove_from_client !== false ? "checked" : ""
                        }>
                        <span class="toggle-slider" style="position:absolute; cursor:pointer; top:0; left:0; right:0; bottom:0; background-color:#3d4353; border-radius:20px; transition:0.4s;"></span>
                    </label>
                    <p class="setting-help">Also remove downloads from the download client (recommended: enabled)</p>
                </div>
                
                <div class="setting-item">
                    <label for="swaparr_research_removed">
                        <a href="https://plexguide.github.io/Huntarr.io/apps/swaparr.html#research-removed" class="info-icon" title="Automatically blocklist and re-search removed downloads" target="_blank" rel="noopener">
                            <i class="fas fa-info-circle"></i>
                        </a>
                        Re-Search Removed Download:
                    </label>
                    <label class="toggle-switch" style="width:40px; height:20px; display:inline-block; position:relative;">
                        <input type="checkbox" id="swaparr_research_removed" ${
                          settings.research_removed === true ? "checked" : ""
                        }>
                        <span class="toggle-slider" style="position:absolute; cursor:pointer; top:0; left:0; right:0; bottom:0; background-color:#3d4353; border-radius:20px; transition:0.4s;"></span>
                    </label>
                    <p class="setting-help">When a download is removed, blocklist it in the *arr app and automatically search for alternatives (retry once)</p>
                </div>
                
                <div class="setting-item">
                    <label for="swaparr_failed_import_detection">
                        <a href="https://plexguide.github.io/Huntarr.io/apps/swaparr.html#failed-import-detection" class="info-icon" title="Automatically handle failed imports" target="_blank" rel="noopener">
                            <i class="fas fa-info-circle"></i>
                        </a>
                        Handle Failed Imports:
                    </label>
                    <label class="toggle-switch" style="width:40px; height:20px; display:inline-block; position:relative;">
                        <input type="checkbox" id="swaparr_failed_import_detection" ${
                          settings.failed_import_detection === true
                            ? "checked"
                            : ""
                        }>
                        <span class="toggle-slider" style="position:absolute; cursor:pointer; top:0; left:0; right:0; bottom:0; background-color:#3d4353; border-radius:20px; transition:0.4s;"></span>
                    </label>
                    <p class="setting-help">Automatically detect failed imports, blocklist them, and search for alternatives</p>
                </div>
                
                <div class="setting-item">
                    <label for="swaparr_dry_run">
                        <a href="https://plexguide.github.io/Huntarr.io/apps/swaparr.html#dry-run-mode" class="info-icon" title="Test mode - no actual removals" target="_blank" rel="noopener">
                            <i class="fas fa-info-circle"></i>
                        </a>
                        Dry Run Mode:
                    </label>
                    <label class="toggle-switch" style="width:40px; height:20px; display:inline-block; position:relative;">
                        <input type="checkbox" id="swaparr_dry_run" ${
                          settings.dry_run === true ? "checked" : ""
                        }>
                        <span class="toggle-slider" style="position:absolute; cursor:pointer; top:0; left:0; right:0; bottom:0; background-color:#3d4353; border-radius:20px; transition:0.4s;"></span>
                    </label>
                    <p class="setting-help">Test mode - logs what would be removed without actually removing anything</p>
                </div>
                
                <div class="setting-item">
                    <label for="swaparr_sleep_duration">
                        <a href="https://plexguide.github.io/Huntarr.io/apps/swaparr.html#sleep-duration" class="info-icon" title="Time between Swaparr cycles" target="_blank" rel="noopener">
                            <i class="fas fa-info-circle"></i>
                        </a>
                        Sleep Duration (Minutes):
                    </label>
                    <div class="input-group" style="display: flex; align-items: center; gap: 10px;">
                        <input type="number" id="swaparr_sleep_duration" value="${
                          settings.sleep_duration
                            ? Math.round(settings.sleep_duration / 60)
                            : 15
                        }" min="10" max="1440" style="width: 120px;">
                        <span style="color: #9ca3af; font-size: 14px;">minutes</span>
                    </div>
                    <p class="setting-help">Time to wait between Swaparr processing cycles (minimum 10 minutes, default: 15 minutes)</p>
                </div>
                
            </div>
            
            <div class="settings-group" style="
                background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%);
                border: 2px solid rgba(90, 109, 137, 0.3);
                border-radius: 12px;
                padding: 20px;
                margin: 15px 0 25px 0;
                box-shadow: 0 4px 12px rgba(90, 109, 137, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1);
            ">
                <h3>Security Features</h3>
                <p class="setting-help" style="margin-bottom: 20px; color: #9ca3af;">
                    Advanced security features to protect your system from malicious downloads and suspicious content by analyzing download names and titles. Detection is based on filename patterns, not file contents.
                </p>
                
                <div class="setting-item">
                    <label for="swaparr_malicious_detection">
                        <a href="https://plexguide.github.io/Huntarr.io/apps/swaparr.html#malicious-file-detection" class="info-icon" title="Enable malicious file detection" target="_blank" rel="noopener">
                            <i class="fas fa-info-circle"></i>
                        </a>
                        Malicious File Detection:
                    </label>
                    <label class="toggle-switch" style="width:40px; height:20px; display:inline-block; position:relative;">
                        <input type="checkbox" id="swaparr_malicious_detection" ${
                          settings.malicious_file_detection === true
                            ? "checked"
                            : ""
                        }>
                        <span class="toggle-slider" style="position:absolute; cursor:pointer; top:0; left:0; right:0; bottom:0; background-color:#3d4353; border-radius:20px; transition:0.4s;"></span>
                    </label>
                    <p class="setting-help">Automatically detect and immediately remove downloads with malicious file types</p>
                </div>
                
                <div class="setting-item">
                    <label for="swaparr_malicious_extensions_input">
                        <a href="https://plexguide.github.io/Huntarr.io/apps/swaparr.html#malicious-extensions" class="info-icon" title="File extensions to consider malicious" target="_blank" rel="noopener">
                            <i class="fas fa-info-circle"></i>
                        </a>
                        Malicious File Extensions:
                    </label>
                    <div class="tag-input-container">
                        <div class="tag-list" id="swaparr_malicious_extensions_tags"></div>
                        <div class="tag-input-wrapper">
                            <input type="text" id="swaparr_malicious_extensions_input" placeholder="Type extension and press Enter (e.g. .lnk)" class="tag-input">
                            <button type="button" class="tag-add-btn" onclick="addExtensionTag()">
                                <i class="fas fa-plus"></i>
                            </button>
                        </div>
                    </div>
                    <p class="setting-help">File extensions to block. Type extension and press Enter or click +. Examples: .lnk, .exe, .bat, .zipx</p>
                </div>
                
                <div class="setting-item">
                    <label for="swaparr_suspicious_patterns_input">
                        <a href="https://plexguide.github.io/Huntarr.io/apps/swaparr.html#suspicious-patterns" class="info-icon" title="Suspicious filename patterns" target="_blank" rel="noopener">
                            <i class="fas fa-info-circle"></i>
                        </a>
                        Suspicious Patterns:
                    </label>
                    <div class="tag-input-container">
                        <div class="tag-list" id="swaparr_suspicious_patterns_tags"></div>
                        <div class="tag-input-wrapper">
                            <input type="text" id="swaparr_suspicious_patterns_input" placeholder="Type pattern and press Enter (e.g. keygen)" class="tag-input">
                            <button type="button" class="tag-add-btn" onclick="addPatternTag()">
                                <i class="fas fa-plus"></i>
                            </button>
                        </div>
                    </div>
                    <p class="setting-help">Filename patterns to block. Type pattern and press Enter or click +. Examples: password.txt, keygen, crack</p>
                </div>
            </div>
            
            <div class="settings-group" style="
                background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%);
                border: 2px solid rgba(90, 109, 137, 0.3);
                border-radius: 12px;
                padding: 20px;
                margin: 15px 0 25px 0;
                box-shadow: 0 4px 12px rgba(90, 109, 137, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1);
            ">
                <h3>Age-Based Cleanup</h3>
                <p class="setting-help" style="margin-bottom: 20px; color: #9ca3af;">
                    Automatically remove downloads that have been stuck for too long, regardless of strike count.
                </p>
                
                <div class="setting-item">
                    <label for="swaparr_age_based_removal">
                        <a href="https://plexguide.github.io/Huntarr.io/apps/swaparr.html#age-based-removal" class="info-icon" title="Enable age-based removal" target="_blank" rel="noopener">
                            <i class="fas fa-info-circle"></i>
                        </a>
                        Enable Age-Based Removal:
                    </label>
                    <label class="toggle-switch" style="width:40px; height:20px; display:inline-block; position:relative;">
                        <input type="checkbox" id="swaparr_age_based_removal" ${
                          settings.age_based_removal === true ? "checked" : ""
                        }>
                        <span class="toggle-slider" style="position:absolute; cursor:pointer; top:0; left:0; right:0; bottom:0; background-color:#3d4353; border-radius:20px; transition:0.4s;"></span>
                    </label>
                    <p class="setting-help">Remove downloads that have been stuck longer than the specified age limit</p>
                </div>
                
                <div class="setting-item">
                    <label for="swaparr_max_age_days">
                        <a href="https://plexguide.github.io/Huntarr.io/apps/swaparr.html#max-age-days" class="info-icon" title="Maximum age before removal" target="_blank" rel="noopener">
                            <i class="fas fa-info-circle"></i>
                        </a>
                        Maximum Age (Days):
                    </label>
                    <input type="number" id="swaparr_max_age_days" min="1" max="30" value="${
                      settings.max_age_days || 7
                    }">
                    <p class="setting-help">Remove downloads older than this many days (default: 7 days)</p>
                </div>
            </div>
            
            <div class="settings-group" style="
                background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%);
                border: 2px solid rgba(90, 109, 137, 0.3);
                border-radius: 12px;
                padding: 20px;
                margin: 15px 0 25px 0;
                box-shadow: 0 4px 12px rgba(90, 109, 137, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1);
            ">
                <h3>Quality-Based Filtering</h3>
                <p class="setting-help" style="margin-bottom: 20px; color: #9ca3af;">
                    Automatically remove downloads with poor or undesirable quality indicators in their names.
                </p>
                
                <div class="setting-item">
                    <label for="swaparr_quality_based_removal">
                        <a href="https://plexguide.github.io/Huntarr.io/apps/swaparr.html#quality-based-removal" class="info-icon" title="Enable quality-based filtering" target="_blank" rel="noopener">
                            <i class="fas fa-info-circle"></i>
                        </a>
                        Enable Quality-Based Filtering:
                    </label>
                    <label class="toggle-switch" style="width:40px; height:20px; display:inline-block; position:relative;">
                        <input type="checkbox" id="swaparr_quality_based_removal" ${
                          settings.quality_based_removal === true
                            ? "checked"
                            : ""
                        }>
                        <span class="toggle-slider" style="position:absolute; cursor:pointer; top:0; left:0; right:0; bottom:0; background-color:#3d4353; border-radius:20px; transition:0.4s;"></span>
                    </label>
                    <p class="setting-help">Automatically remove downloads with blocked quality patterns in their names</p>
                </div>
                
                <div class="setting-item">
                    <label for="swaparr_quality_patterns_input">
                        <a href="https://plexguide.github.io/Huntarr.io/apps/swaparr.html#blocked-quality-patterns" class="info-icon" title="Quality patterns to block" target="_blank" rel="noopener">
                            <i class="fas fa-info-circle"></i>
                        </a>
                        Blocked Quality Patterns:
                    </label>
                    <div class="tag-input-container">
                        <div class="tag-list" id="swaparr_quality_patterns_tags"></div>
                        <div class="tag-input-wrapper">
                            <input type="text" id="swaparr_quality_patterns_input" placeholder="Type quality pattern and press Enter (e.g. cam)" class="tag-input">
                            <button type="button" class="tag-add-btn" onclick="addQualityTag()">
                                <i class="fas fa-plus"></i>
                            </button>
                        </div>
                    </div>
                    <p class="setting-help">Quality patterns to block. Type pattern and press Enter or click +. Examples: cam, ts, hdcam, workprint</p>
                </div>
            </div>

        `;

    container.innerHTML = html;

    // Load Swaparr GitHub star count dynamically
    this.loadSwaparrStarCount();

    // Initialize tag systems
    this.initializeTagSystem(settings);

    // Add event listener for global Swaparr enabled toggle to control instance visibility
    const swaparrEnabledToggle = container.querySelector("#swaparr_enabled");
    if (swaparrEnabledToggle) {
      swaparrEnabledToggle.addEventListener("change", () => {
        // Update cache when global toggle changes
        if (
          window.huntarrUI &&
          window.huntarrUI.originalSettings &&
          window.huntarrUI.originalSettings.swaparr
        ) {
          window.huntarrUI.originalSettings.swaparr.enabled =
            swaparrEnabledToggle.checked;
        }

        // Update cached settings in localStorage
        try {
          const cachedSettings = localStorage.getItem("huntarr-settings-cache");
          if (cachedSettings) {
            const settings = JSON.parse(cachedSettings);
            if (!settings.swaparr) settings.swaparr = {};
            settings.swaparr.enabled = swaparrEnabledToggle.checked;
            localStorage.setItem(
              "huntarr-settings-cache",
              JSON.stringify(settings)
            );
          }
        } catch (e) {
          console.warn("[SettingsForms] Failed to update cached settings:", e);
        }

        // Update disabled state of Swaparr fields in all app forms
        this.updateSwaparrFieldsDisabledState();
      });

      // Initial disabled state update
      setTimeout(() => {
        this.updateSwaparrFieldsDisabledState();
      }, 100);
    }

    // Set up manual save functionality for Swaparr
    this.setupSwaparrManualSave(container, settings);
  },

  // Set up manual save functionality for Settings
  setupSettingsManualSave: function (container, originalSettings = {}) {
    console.log(
      "[SettingsForms] Setting up manual save for Settings with original settings:",
      originalSettings
    );

    const saveButton = document.querySelector("#settings-save-button");
    if (!saveButton) {
      console.error("[SettingsForms] Settings save button not found!");
      return;
    }

    let hasChanges = false;

    // Clear any existing unsaved changes state and warnings when setting up
    window.settingsUnsavedChanges = false;
    this.removeUnsavedChangesWarning();

    // Initialize button in disabled/grey state immediately
    saveButton.disabled = true;
    saveButton.style.background = "#6b7280";
    saveButton.style.color = "#9ca3af";
    saveButton.style.borderColor = "#4b5563";
    saveButton.style.cursor = "not-allowed";
    console.log(
      "[SettingsForms] Settings save button initialized as disabled (grey)"
    );

    // Function to update save button state
    const updateSaveButtonState = (changesDetected) => {
      hasChanges = changesDetected;
      window.settingsUnsavedChanges = changesDetected;
      console.log(
        `[SettingsForms] Updating settings save button state: hasChanges=${hasChanges}, global unsaved=${window.settingsUnsavedChanges}`
      );

      if (hasChanges) {
        // Red enabled state
        saveButton.disabled = false;
        saveButton.style.background = "#dc2626";
        saveButton.style.color = "#ffffff";
        saveButton.style.borderColor = "#dc2626";
        saveButton.style.cursor = "pointer";
        console.log("[SettingsForms] Settings save button enabled (red)");

        // Add beforeunload warning for page refresh
        SettingsForms.addUnsavedChangesWarning();
      } else {
        // Grey disabled state
        saveButton.disabled = true;
        saveButton.style.background = "#6b7280";
        saveButton.style.color = "#9ca3af";
        saveButton.style.borderColor = "#4b5563";
        saveButton.style.cursor = "not-allowed";
        console.log("[SettingsForms] Settings save button disabled (grey)");

        // Remove beforeunload warning when no changes
        SettingsForms.removeUnsavedChangesWarning();
      }
    };

    // Function to detect changes in form elements
    const detectChanges = () => {
      // Check regular form inputs
      const inputs = container.querySelectorAll("input, select, textarea");
      let formChanged = false;

      inputs.forEach((input) => {
        // Skip disabled inputs or inputs without IDs
        if (!input.id || input.disabled) {
          return;
        }

        let key = input.id;
        let originalValue, currentValue;

        if (input.type === "checkbox") {
          originalValue =
            originalSettings[key] !== undefined ? originalSettings[key] : false;
          currentValue = input.checked;
        } else if (input.type === "number") {
          // Get default from input attributes or use 0
          const defaultValue =
            parseInt(input.getAttribute("value")) || parseInt(input.min) || 0;
          originalValue =
            originalSettings[key] !== undefined
              ? parseInt(originalSettings[key])
              : defaultValue;
          currentValue = parseInt(input.value) || 0;
        } else {
          originalValue = originalSettings[key] || "";
          currentValue = input.value.trim();
        }

        console.log(
          `[SettingsForms] Checking settings ${key}: original=${originalValue}, current=${currentValue}`
        );

        if (originalValue !== currentValue) {
          console.log(
            `[SettingsForms] Settings change detected in ${key}: ${originalValue} -> ${currentValue}`
          );
          formChanged = true;
        }
      });

      // Special handling for apprise_urls which is a textarea with newlines
      const appriseUrlsElement = container.querySelector("#apprise_urls");
      if (appriseUrlsElement) {
        const originalUrls = originalSettings.apprise_urls || [];
        const currentUrls = appriseUrlsElement.value
          .split("\n")
          .map((url) => url.trim())
          .filter((url) => url.length > 0);

        if (
          JSON.stringify(originalUrls.sort()) !==
          JSON.stringify(currentUrls.sort())
        ) {
          console.log("[SettingsForms] Settings apprise_urls change detected");
          formChanged = true;
        }
      }

      console.log(
        `[SettingsForms] Settings change detection result: ${formChanged}`
      );
      updateSaveButtonState(formChanged);
    };

    // Add event listeners to all form elements
    const inputs = container.querySelectorAll("input, select, textarea");
    inputs.forEach((input) => {
      input.addEventListener("change", detectChanges);
      if (
        input.type === "text" ||
        input.type === "number" ||
        input.tagName.toLowerCase() === "textarea"
      ) {
        input.addEventListener("input", detectChanges);
      }
    });

    // Save button click handler
    saveButton.addEventListener("click", () => {
      if (!hasChanges) return;

      console.log("[SettingsForms] Manual save triggered for Settings");

      // Show saving state
      saveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
      saveButton.disabled = true;

      // Get settings and save
      if (window.huntarrUI && window.huntarrUI.autoSaveGeneralSettings) {
        window.huntarrUI
          .autoSaveGeneralSettings(true)
          .then(() => {
            console.log("[SettingsForms] Settings manual save successful");

            // Reset button state and clear unsaved changes warning
            saveButton.innerHTML = '<i class="fas fa-save"></i> Save Changes';
            updateSaveButtonState(false);

            // Update original settings for future change detection
            const updatedSettings = window.huntarrUI.getFormSettings("general");
            if (updatedSettings) {
              Object.assign(originalSettings, updatedSettings);
            }
          })
          .catch((error) => {
            console.error(
              "[SettingsForms] Settings manual save failed:",
              error
            );

            // Reset button state
            saveButton.innerHTML = '<i class="fas fa-save"></i> Save Changes';
            updateSaveButtonState(hasChanges);
          });
      }
    });

    // Initial change detection - ensure form is fully loaded before checking
    // Use a longer timeout to ensure all form elements are properly initialized
    setTimeout(() => {
      console.log(
        "[SettingsForms] Running initial change detection for Settings"
      );
      detectChanges();
    }, 200);
  },

  // Set up manual save functionality for Notifications
  setupNotificationsManualSave: function (container, originalSettings = {}) {
    console.log(
      "[SettingsForms] Setting up manual save for Notifications with original settings:",
      originalSettings
    );

    const saveButton = document.querySelector("#notifications-save-button");
    if (!saveButton) {
      console.error("[SettingsForms] Notifications save button not found!");
      return;
    }

    let hasChanges = false;
    let suppressInitialDetection = true; // Suppress change detection during initial setup

    // Clear any existing unsaved changes state and warnings when setting up
    window.notificationsUnsavedChanges = false;
    this.removeUnsavedChangesWarning();

    // Capture the actual form state as baseline instead of guessing defaults
    let normalizedSettings = {};

    // Initialize button in disabled/grey state immediately
    saveButton.disabled = true;
    saveButton.style.background = "#6b7280";
    saveButton.style.color = "#9ca3af";
    saveButton.style.borderColor = "#4b5563";
    saveButton.style.cursor = "not-allowed";
    console.log(
      "[SettingsForms] Notifications save button initialized as disabled (grey)"
    );

    // Function to update save button state
    const updateSaveButtonState = (changesDetected) => {
      hasChanges = changesDetected;
      window.notificationsUnsavedChanges = changesDetected;
      console.log(
        `[SettingsForms] Updating notifications save button state: hasChanges=${hasChanges}, global unsaved=${window.notificationsUnsavedChanges}`
      );

      if (hasChanges) {
        // Red enabled state
        saveButton.disabled = false;
        saveButton.style.background = "#dc2626";
        saveButton.style.color = "#ffffff";
        saveButton.style.borderColor = "#dc2626";
        saveButton.style.cursor = "pointer";
        console.log("[SettingsForms] Notifications save button enabled (red)");

        // Add beforeunload warning for page refresh
        SettingsForms.addUnsavedChangesWarning();
      } else {
        // Grey disabled state
        saveButton.disabled = true;
        saveButton.style.background = "#6b7280";
        saveButton.style.color = "#9ca3af";
        saveButton.style.borderColor = "#4b5563";
        saveButton.style.cursor = "not-allowed";
        console.log(
          "[SettingsForms] Notifications save button disabled (grey)"
        );

        // Remove beforeunload warning when no changes
        SettingsForms.removeUnsavedChangesWarning();
      }
    };

    // Function to detect changes in form elements
    const detectChanges = () => {
      // Skip change detection if still in initial setup phase
      if (suppressInitialDetection) {
        console.log(
          "[SettingsForms] Notifications change detection suppressed during initial setup"
        );
        return;
      }

      // Check regular form inputs
      const inputs = container.querySelectorAll("input, select, textarea");
      let formChanged = false;

      inputs.forEach((input) => {
        // Skip disabled inputs or inputs without IDs
        if (!input.id || input.disabled) {
          return;
        }

        let key = input.id;
        let originalValue, currentValue;

        if (input.type === "checkbox") {
          originalValue =
            normalizedSettings[key] !== undefined
              ? normalizedSettings[key]
              : false;
          currentValue = input.checked;
        } else if (input.type === "number") {
          // Get default from input attributes or use 0
          const defaultValue =
            parseInt(input.getAttribute("value")) || parseInt(input.min) || 0;
          originalValue =
            normalizedSettings[key] !== undefined
              ? parseInt(normalizedSettings[key])
              : defaultValue;
          currentValue = parseInt(input.value) || 0;
        } else {
          originalValue = normalizedSettings[key] || "";
          currentValue = input.value.trim();
        }

        console.log(
          `[SettingsForms] Checking notifications ${key}: original=${originalValue}, current=${currentValue}`
        );

        if (originalValue !== currentValue) {
          console.log(
            `[SettingsForms] Notifications change detected in ${key}: ${originalValue} -> ${currentValue}`
          );
          formChanged = true;
        }
      });

      // Special handling for apprise_urls which is a textarea with newlines
      const appriseUrlsElement = container.querySelector("#apprise_urls");
      if (appriseUrlsElement) {
        const originalUrls = normalizedSettings.apprise_urls || [];
        const currentUrls = appriseUrlsElement.value
          .split("\n")
          .map((url) => url.trim())
          .filter((url) => url.length > 0);

        if (
          JSON.stringify(originalUrls.sort()) !==
          JSON.stringify(currentUrls.sort())
        ) {
          console.log(
            "[SettingsForms] Notifications apprise_urls change detected"
          );
          formChanged = true;
        }
      }

      console.log(
        `[SettingsForms] Notifications change detection result: ${formChanged}`
      );
      updateSaveButtonState(formChanged);
    };

    // Add event listeners to all form elements
    const inputs = container.querySelectorAll("input, select, textarea");
    inputs.forEach((input) => {
      input.addEventListener("change", detectChanges);
      if (
        input.type === "text" ||
        input.type === "number" ||
        input.tagName.toLowerCase() === "textarea"
      ) {
        input.addEventListener("input", detectChanges);
      }
    });

    // Save button click handler
    saveButton.addEventListener("click", () => {
      if (!hasChanges) return;

      console.log("[SettingsForms] Manual save triggered for Notifications");

      // Show saving state
      saveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
      saveButton.disabled = true;

      // Get settings and save
      if (window.huntarrUI && window.huntarrUI.autoSaveGeneralSettings) {
        window.huntarrUI
          .autoSaveGeneralSettings(true)
          .then(() => {
            console.log("[SettingsForms] Notifications manual save successful");

            // Reset button state and clear unsaved changes warning
            saveButton.innerHTML = '<i class="fas fa-save"></i> Save Changes';
            updateSaveButtonState(false);

            // Update original settings for future change detection
            const updatedSettings = window.huntarrUI.getFormSettings("general");
            if (updatedSettings) {
              Object.assign(normalizedSettings, updatedSettings);
            }
          })
          .catch((error) => {
            console.error(
              "[SettingsForms] Notifications manual save failed:",
              error
            );

            // Reset button state
            saveButton.innerHTML = '<i class="fas fa-save"></i> Save Changes';
            updateSaveButtonState(hasChanges);
          });
      }
    });

    // Initial setup - capture actual form state as baseline
    // Use a longer timeout to ensure all form elements are properly initialized
    setTimeout(() => {
      console.log(
        "[SettingsForms] Capturing actual form state as notifications baseline"
      );

      // Capture the current form state as our baseline instead of guessing defaults
      const inputs = container.querySelectorAll("input, select, textarea");
      inputs.forEach((input) => {
        if (!input.id || input.disabled) return;

        let value;
        if (input.type === "checkbox") {
          value = input.checked;
        } else if (input.type === "number") {
          value = parseInt(input.value) || 0;
        } else if (input.id === "apprise_urls") {
          // Special handling for textarea - convert to array for comparison
          value = input.value
            .split("\n")
            .map((url) => url.trim())
            .filter((url) => url.length > 0);
        } else {
          value = input.value.trim();
        }

        normalizedSettings[input.id] = value;
      });

      // Force button to grey state and clear any changes
      saveButton.disabled = true;
      saveButton.style.background = "#6b7280";
      saveButton.style.color = "#9ca3af";
      saveButton.style.borderColor = "#4b5563";
      saveButton.style.cursor = "not-allowed";
      window.notificationsUnsavedChanges = false;
      hasChanges = false;

      // Enable change detection now that baseline is captured
      suppressInitialDetection = false;
      console.log(
        "[SettingsForms] Notifications baseline captured, change detection enabled"
      );
    }, 500);
  },

  // Set up manual save functionality for App instances (Sonarr, Radarr, etc.)
  setupAppManualSave: function (container, appType, originalSettings = {}) {
    console.log(
      `[SettingsForms] Setting up manual save for ${appType} with original settings:`,
      originalSettings
    );

    const saveButton = document.querySelector(`#${appType}-save-button`);
    if (!saveButton) {
      console.error(`[SettingsForms] ${appType} save button not found!`);
      return;
    }

    let hasChanges = false;
    let suppressInitialDetection = true; // Suppress change detection during initial setup

    // Clear any existing unsaved changes state and warnings when setting up
    window[`${appType}UnsavedChanges`] = false;
    this.removeUnsavedChangesWarning();

    // Capture the actual form state as baseline instead of guessing defaults
    let normalizedSettings = {};

    // Initialize button in disabled/grey state immediately
    saveButton.disabled = true;
    saveButton.style.background = "#6b7280";
    saveButton.style.color = "#9ca3af";
    saveButton.style.borderColor = "#4b5563";
    saveButton.style.cursor = "not-allowed";

    // Function to update save button state
    const updateSaveButtonState = (changed) => {
      hasChanges = changed;
      window[`${appType}UnsavedChanges`] = changed;

      if (changed) {
        // Red state - changes detected
        saveButton.disabled = false;
        saveButton.style.background = "#dc2626";
        saveButton.style.color = "#ffffff";
        saveButton.style.borderColor = "#b91c1c";
        saveButton.style.cursor = "pointer";
        saveButton.style.opacity = "1";
        this.addUnsavedChangesWarning();
      } else {
        // Grey state - no changes
        saveButton.disabled = true;
        saveButton.style.background = "#6b7280";
        saveButton.style.color = "#9ca3af";
        saveButton.style.borderColor = "#4b5563";
        saveButton.style.cursor = "not-allowed";
        saveButton.style.opacity = "0.7";
        this.removeUnsavedChangesWarning();
      }
    };

    // Function to detect changes in form elements
    const detectChanges = () => {
      // Skip change detection if still in initial setup phase
      if (suppressInitialDetection) {
        console.log(
          `[SettingsForms] ${appType} change detection suppressed during initial setup`
        );
        return;
      }

      let formChanged = false;

      // Check if number of instances has changed
      const currentInstanceCount =
        container.querySelectorAll(".instance-item").length;
      const originalInstanceCount =
        normalizedSettings.originalInstanceCount || 0;

      if (currentInstanceCount !== originalInstanceCount) {
        console.log(
          `[SettingsForms] ${appType} instance count changed: ${originalInstanceCount} -> ${currentInstanceCount}`
        );
        formChanged = true;
      }

      // Check regular form inputs
      const inputs = container.querySelectorAll("input, select, textarea");

      inputs.forEach((input) => {
        // Skip disabled inputs, inputs without IDs, or buttons
        if (
          !input.id ||
          input.disabled ||
          input.type === "button" ||
          input.type === "submit"
        ) {
          return;
        }

        let key = input.id;
        let originalValue, currentValue;

        if (input.type === "checkbox") {
          originalValue =
            normalizedSettings[key] !== undefined
              ? normalizedSettings[key]
              : false;
          currentValue = input.checked;
        } else if (input.type === "number") {
          originalValue =
            normalizedSettings[key] !== undefined
              ? parseInt(normalizedSettings[key])
              : 0;
          currentValue = parseInt(input.value) || 0;
        } else {
          originalValue = normalizedSettings[key] || "";
          currentValue = input.value.trim();
        }

        if (originalValue !== currentValue) {
          console.log(
            `[SettingsForms] ${appType} change detected in ${key}: ${originalValue} -> ${currentValue}`
          );
          formChanged = true;
        }
      });

      console.log(
        `[SettingsForms] ${appType} change detection result: ${formChanged}`
      );
      updateSaveButtonState(formChanged);
    };

    // Add event listeners to all form elements
    const inputs = container.querySelectorAll("input, select, textarea");
    inputs.forEach((input) => {
      // Skip buttons and test-related elements
      if (
        input.type === "button" ||
        input.type === "submit" ||
        input.classList.contains("test-connection-btn") ||
        (input.id && input.id.includes("test-"))
      ) {
        return;
      }

      input.addEventListener("change", detectChanges);
      if (
        input.type === "text" ||
        input.type === "number" ||
        input.tagName.toLowerCase() === "textarea"
      ) {
        input.addEventListener("input", detectChanges);
      }
    });

    // Also listen for change events on the container (for instance add/remove)
    container.addEventListener("change", detectChanges);

    // Save button click handler
    saveButton.addEventListener("click", () => {
      if (!hasChanges) return;

      console.log(`[SettingsForms] Manual save triggered for ${appType}`);

      // Show saving state
      saveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
      saveButton.disabled = true;

      // Collect form settings
      let settings;
      try {
        settings = SettingsForms.getFormSettings(container, appType);
        console.log(`[SettingsForms] Collected ${appType} settings:`, settings);
      } catch (error) {
        console.error(
          `[SettingsForms] Error collecting ${appType} settings:`,
          error
        );
        saveButton.innerHTML = '<i class="fas fa-save"></i> Save Changes';
        updateSaveButtonState(hasChanges);
        return;
      }

      // Save settings to server
      HuntarrUtils.fetchWithTimeout(`./api/settings/${appType}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error(
              `HTTP error ${response.status}: ${response.statusText}`
            );
          }
          return response.json();
        })
        .then((data) => {
          console.log(
            `[SettingsForms] ${appType} settings saved successfully:`,
            data
          );

          // Reset button state and clear unsaved changes warning
          saveButton.innerHTML = '<i class="fas fa-save"></i> Save Changes';
          updateSaveButtonState(false);

          // Update baseline after successful save
          captureFormBaseline();

          // Show success notification
          if (
            typeof huntarrUI !== "undefined" &&
            typeof huntarrUI.showNotification === "function"
          ) {
            huntarrUI.showNotification(
              `${
                appType.charAt(0).toUpperCase() + appType.slice(1)
              } settings saved successfully`,
              "success"
            );
          }
        })
        .catch((error) => {
          console.error(
            `[SettingsForms] Error saving ${appType} settings:`,
            error
          );

          // Reset button state but keep changes detected
          saveButton.innerHTML = '<i class="fas fa-save"></i> Save Changes';
          updateSaveButtonState(hasChanges);

          // Show error notification
          if (
            typeof huntarrUI !== "undefined" &&
            typeof huntarrUI.showNotification === "function"
          ) {
            huntarrUI.showNotification(
              `Error saving ${appType} settings: ${error.message}`,
              "error"
            );
          } else {
            alert(`Error saving ${appType} settings: ${error.message}`);
          }
        });
    });

    // Function to capture current form state as baseline
    const captureFormBaseline = () => {
      // Capture instance count
      normalizedSettings.originalInstanceCount =
        container.querySelectorAll(".instance-item").length;

      const inputs = container.querySelectorAll("input, select, textarea");
      inputs.forEach((input) => {
        if (
          !input.id ||
          input.disabled ||
          input.type === "button" ||
          input.type === "submit"
        )
          return;

        let value;
        if (input.type === "checkbox") {
          value = input.checked;
        } else if (input.type === "number") {
          value = parseInt(input.value) || 0;
        } else {
          value = input.value.trim();
        }

        normalizedSettings[input.id] = value;
      });
    };

    // Initial setup - capture actual form state as baseline
    setTimeout(() => {
      console.log(
        `[SettingsForms] Capturing actual form state as ${appType} baseline`
      );

      captureFormBaseline();

      // Force button to grey state and clear any changes
      saveButton.disabled = true;
      saveButton.style.background = "#6b7280";
      saveButton.style.color = "#9ca3af";
      saveButton.style.borderColor = "#4b5563";
      saveButton.style.cursor = "not-allowed";
      window[`${appType}UnsavedChanges`] = false;
      hasChanges = false;

      // Enable change detection now that baseline is captured
      suppressInitialDetection = false;
      console.log(
        `[SettingsForms] ${appType} baseline captured, change detection enabled`
      );
    }, 500);
  },

  // Set up manual save functionality for Swaparr
  setupSwaparrManualSave: function (container, originalSettings = {}) {
    console.log(
      "[SettingsForms] Setting up manual save with original settings:",
      originalSettings
    );

    const saveButton = container.querySelector("#swaparr-save-button");
    if (!saveButton) {
      console.error("[SettingsForms] Save button not found!");
      return;
    }

    let hasChanges = false;

    // Clear any existing unsaved changes state and warnings when setting up
    window.swaparrUnsavedChanges = false;
    this.removeUnsavedChangesWarning();

    // Initialize button in disabled/grey state immediately
    saveButton.disabled = true;
    saveButton.style.background = "#6b7280";
    saveButton.style.color = "#9ca3af";
    saveButton.style.borderColor = "#4b5563";
    saveButton.style.cursor = "not-allowed";
    console.log("[SettingsForms] Save button initialized as disabled (grey)");

    // Function to update save button state
    const updateSaveButtonState = (changesDetected) => {
      hasChanges = changesDetected;
      window.swaparrUnsavedChanges = changesDetected;
      console.log(
        `[SettingsForms] Updating save button state: hasChanges=${hasChanges}, global unsaved=${window.swaparrUnsavedChanges}`
      );

      if (hasChanges) {
        // Red enabled state
        saveButton.disabled = false;
        saveButton.style.background = "#dc2626";
        saveButton.style.color = "#ffffff";
        saveButton.style.borderColor = "#dc2626";
        saveButton.style.cursor = "pointer";
        console.log("[SettingsForms] Save button enabled (red)");

        // Add beforeunload warning for page refresh
        SettingsForms.addUnsavedChangesWarning();
      } else {
        // Grey disabled state
        saveButton.disabled = true;
        saveButton.style.background = "#6b7280";
        saveButton.style.color = "#9ca3af";
        saveButton.style.borderColor = "#4b5563";
        saveButton.style.cursor = "not-allowed";
        console.log("[SettingsForms] Save button disabled (grey)");

        // Remove beforeunload warning when no changes
        SettingsForms.removeUnsavedChangesWarning();
      }
    };

    // Function to detect changes in form elements
    const detectChanges = () => {
      // Check regular form inputs
      const inputs = container.querySelectorAll("input, select, textarea");
      let formChanged = false;

      inputs.forEach((input) => {
        // Skip inputs that don't have swaparr prefix or are disabled
        if (!input.id.startsWith("swaparr_") || input.disabled) {
          return;
        }

        let key = input.id.replace("swaparr_", "");

        // Handle field name mappings for settings that have different names
        if (key === "malicious_detection") {
          key = "malicious_file_detection";
        }

        let originalValue, currentValue;

        if (input.type === "checkbox") {
          originalValue =
            originalSettings[key] !== undefined ? originalSettings[key] : false;
          currentValue = input.checked;
        } else if (input.type === "number") {
          // Special handling for sleep_duration (stored in seconds, displayed in minutes)
          if (key === "sleep_duration") {
            originalValue = originalSettings[key]
              ? Math.round(originalSettings[key] / 60)
              : 15;
            currentValue = parseInt(input.value) || 15;
          } else {
            // For other numeric fields, get default from input attributes or use 0
            const defaultValue =
              parseInt(input.getAttribute("value")) || parseInt(input.min) || 0;
            originalValue =
              originalSettings[key] !== undefined
                ? parseInt(originalSettings[key])
                : defaultValue;
            currentValue = parseInt(input.value) || 0;
          }
        } else {
          originalValue = originalSettings[key] || "";
          currentValue = input.value.trim();
        }

        console.log(
          `[SettingsForms] Checking ${key}: original=${originalValue}, current=${currentValue}`
        );

        if (originalValue !== currentValue) {
          console.log(
            `[SettingsForms] Change detected in ${key}: ${originalValue} -> ${currentValue}`
          );
          formChanged = true;
        }
      });

      // Check tag containers for changes
      const tagContainers = [
        {
          containerId: "swaparr_malicious_extensions_tags",
          settingKey: "malicious_extensions",
        },
        {
          containerId: "swaparr_suspicious_patterns_tags",
          settingKey: "suspicious_patterns",
        },
        {
          containerId: "swaparr_quality_patterns_tags",
          settingKey: "blocked_quality_patterns",
        },
      ];

      tagContainers.forEach(({ containerId, settingKey }) => {
        const currentTags = this.getTagsFromContainer(containerId);
        const originalTags = originalSettings[settingKey] || [];

        console.log(`[SettingsForms] Comparing tags for ${settingKey}:`);
        console.log(`[SettingsForms] Current:`, currentTags);
        console.log(`[SettingsForms] Original:`, originalTags);

        if (
          JSON.stringify(currentTags.sort()) !==
          JSON.stringify(originalTags.sort())
        ) {
          console.log(`[SettingsForms] Tag changes detected for ${settingKey}`);
          formChanged = true;
        }
      });

      console.log(`[SettingsForms] Change detection result: ${formChanged}`);
      updateSaveButtonState(formChanged);
    };

    // Add event listeners to all form elements
    const inputs = container.querySelectorAll("input, select, textarea");
    inputs.forEach((input) => {
      input.addEventListener("change", detectChanges);
      if (
        input.type === "text" ||
        input.type === "number" ||
        input.tagName.toLowerCase() === "textarea"
      ) {
        input.addEventListener("input", detectChanges);
      }
    });

    // Override tag manipulation functions to trigger change detection
    const originalAddExtensionTag = this.addExtensionTag.bind(this);
    const originalAddPatternTag = this.addPatternTag.bind(this);
    const originalAddQualityTag = this.addQualityTag.bind(this);

    this.addExtensionTag = function () {
      originalAddExtensionTag();
      setTimeout(detectChanges, 10);
    };

    this.addPatternTag = function () {
      originalAddPatternTag();
      setTimeout(detectChanges, 10);
    };

    this.addQualityTag = function () {
      originalAddQualityTag();
      setTimeout(detectChanges, 10);
    };

    // Make functions globally available
    window.addExtensionTag = this.addExtensionTag.bind(this);
    window.addPatternTag = this.addPatternTag.bind(this);
    window.addQualityTag = this.addQualityTag.bind(this);

    // Add observer for tag removal (since they use onclick)
    const observeTagRemovals = () => {
      const tagContainerIds = [
        "swaparr_malicious_extensions_tags",
        "swaparr_suspicious_patterns_tags",
        "swaparr_quality_patterns_tags",
      ];

      tagContainerIds.forEach((containerId) => {
        const container = document.getElementById(containerId);
        if (container) {
          const observer = new MutationObserver(() => {
            setTimeout(detectChanges, 10);
          });
          observer.observe(container, { childList: true });
        }
      });
    };

    // Set up tag removal observation after tags are loaded
    setTimeout(observeTagRemovals, 100);

    // Save button click handler
    saveButton.addEventListener("click", () => {
      if (!hasChanges) return;

      console.log("[SettingsForms] Manual save triggered for Swaparr");

      // Show saving state
      saveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
      saveButton.disabled = true;

      // Get settings and save
      if (window.huntarrUI && window.huntarrUI.autoSaveSwaparrSettings) {
        window.huntarrUI
          .autoSaveSwaparrSettings(true)
          .then(() => {
            console.log("[SettingsForms] Swaparr manual save successful");

            // Reset button state and clear unsaved changes warning
            saveButton.innerHTML = '<i class="fas fa-save"></i> Save Changes';
            updateSaveButtonState(false);

            // Update original settings for future change detection
            const updatedSettings = window.huntarrUI.getFormSettings("swaparr");
            if (updatedSettings) {
              Object.assign(originalSettings, updatedSettings);
            }

            // Update Swaparr field visibility in all loaded app forms
            console.log(
              "[SettingsForms] Broadcasting Swaparr state change to all app forms after manual save..."
            );
            this.updateSwaparrFieldsDisabledState();
          })
          .catch((error) => {
            console.error("[SettingsForms] Swaparr manual save failed:", error);

            // Reset button state
            saveButton.innerHTML = '<i class="fas fa-save"></i> Save Changes';
            updateSaveButtonState(hasChanges);
          });
      }
    });

    // Initial change detection - ensure form is fully loaded before checking
    // Use a longer timeout to ensure all form elements are properly initialized
    setTimeout(() => {
      console.log(
        "[SettingsForms] Running initial change detection for Swaparr"
      );
      detectChanges();
    }, 200);
  },

  // Set up auto-save for a form container
  setupAutoSave: function (container) {
    if (!container) return;

    const appType = container.getAttribute("data-app-type") || "general";

    // Skip auto-save for all forms - they now use manual save
    const manualSaveApps = [
      "swaparr",
      "general",
      "notifications",
      "sonarr",
      "radarr",
      "lidarr",
      "readarr",
      "whisparr",
      "eros",
      "prowlarr",
    ];
    if (manualSaveApps.includes(appType)) {
      console.log(
        `[SettingsForms] Skipping auto-save setup for ${appType} - using manual save`
      );
      return;
    }

    console.log(
      `[SettingsForms] Setting up auto-save for app type: ${appType}`
    );

    // Find all input elements in the container
    const inputs = container.querySelectorAll("input, select, textarea");

    inputs.forEach((input) => {
      // Add change event listener for auto-save
      input.addEventListener("change", () => {
        console.log(
          `[SettingsForms] Auto-save triggered for ${appType} by ${
            input.id || input.name || "unnamed input"
          }`
        );

        // Settings now use manual save - no auto-save
        if (appType === "general") {
          console.log(
            `[SettingsForms] Settings use manual save - skipping auto-save for ${appType}`
          );
        } else {
          console.warn(
            `[SettingsForms] No auto-save function available for app type: ${appType}`
          );
        }
      });

      // Also add input event listener for immediate feedback on text inputs
      if (
        input.type === "text" ||
        input.type === "number" ||
        input.tagName.toLowerCase() === "textarea"
      ) {
        let timeout;
        input.addEventListener("input", () => {
          // Debounce to avoid too many saves
          clearTimeout(timeout);
          timeout = setTimeout(() => {
            console.log(
              `[SettingsForms] Auto-save triggered by input for ${appType}`
            );

            if (appType === "general") {
              console.log(
                `[SettingsForms] Settings use manual save - skipping auto-save for input in ${appType}`
              );
            }
          }, 1000); // 1 second debounce
        });
      }
    });

    console.log(
      `[SettingsForms] Auto-save set up for ${inputs.length} inputs in ${appType} form`
    );
  },

  // Initialize tag input systems for malicious file detection
  initializeTagSystem: function (settings) {
    // Initialize extensions
    const defaultExtensions = [
      ".lnk",
      ".exe",
      ".bat",
      ".cmd",
      ".scr",
      ".pif",
      ".com",
      ".zipx",
      ".jar",
      ".vbs",
      ".js",
      ".jse",
      ".wsf",
      ".wsh",
    ];
    const extensions = settings.malicious_extensions || defaultExtensions;
    this.loadTags("swaparr_malicious_extensions_tags", extensions);

    // Initialize patterns
    const defaultPatterns = [
      "password.txt",
      "readme.txt",
      "install.exe",
      "setup.exe",
      "keygen",
      "crack",
      "patch.exe",
      "activator",
    ];
    const patterns = settings.suspicious_patterns || defaultPatterns;
    this.loadTags("swaparr_suspicious_patterns_tags", patterns);

    // Initialize quality patterns
    const defaultQualityPatterns = [
      "cam",
      "camrip",
      "hdcam",
      "ts",
      "telesync",
      "tc",
      "telecine",
      "r6",
      "dvdscr",
      "dvdscreener",
      "workprint",
      "wp",
    ];
    const qualityPatterns =
      settings.blocked_quality_patterns || defaultQualityPatterns;
    this.loadTags("swaparr_quality_patterns_tags", qualityPatterns);

    // Add enter key listeners
    const extensionInput = document.getElementById(
      "swaparr_malicious_extensions_input"
    );
    const patternInput = document.getElementById(
      "swaparr_suspicious_patterns_input"
    );
    const qualityInput = document.getElementById(
      "swaparr_quality_patterns_input"
    );

    if (extensionInput) {
      extensionInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          this.addExtensionTag();
        }
      });
    }

    if (patternInput) {
      patternInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          this.addPatternTag();
        }
      });
    }

    if (qualityInput) {
      qualityInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          this.addQualityTag();
        }
      });
    }

    // Make functions globally accessible
    window.addExtensionTag = () => this.addExtensionTag();
    window.addPatternTag = () => this.addPatternTag();
    window.addQualityTag = () => this.addQualityTag();
  },

  // Load tags into a tag list
  loadTags: function (containerId, tags) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = "";
    tags.forEach((tag) => {
      this.createTagElement(container, tag);
    });
  },

  // Create a tag element
  createTagElement: function (container, text) {
    const tagDiv = document.createElement("div");
    tagDiv.className = "tag-item";
    tagDiv.innerHTML = `
            <span class="tag-text">${text}</span>
            <button type="button" class="tag-remove" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;
    container.appendChild(tagDiv);
  },

  // Add extension tag
  addExtensionTag: function () {
    const input = document.getElementById("swaparr_malicious_extensions_input");
    const container = document.getElementById(
      "swaparr_malicious_extensions_tags"
    );

    if (!input || !container) return;

    let value = input.value.trim();
    if (!value) return;

    // Auto-add dot if not present for extensions
    if (!value.startsWith(".")) {
      value = "." + value;
    }

    // Check for duplicates
    const existing = Array.from(container.querySelectorAll(".tag-text")).map(
      (el) => el.textContent
    );
    if (existing.includes(value)) {
      input.value = "";
      return;
    }

    this.createTagElement(container, value);
    input.value = "";
  },

  // Add pattern tag
  addPatternTag: function () {
    const input = document.getElementById("swaparr_suspicious_patterns_input");
    const container = document.getElementById(
      "swaparr_suspicious_patterns_tags"
    );

    if (!input || !container) return;

    const value = input.value.trim();
    if (!value) return;

    // Check for duplicates
    const existing = Array.from(container.querySelectorAll(".tag-text")).map(
      (el) => el.textContent
    );
    if (existing.includes(value)) {
      input.value = "";
      return;
    }

    this.createTagElement(container, value);
    input.value = "";
  },

  // Add quality pattern tag
  addQualityTag: function () {
    const input = document.getElementById("swaparr_quality_patterns_input");
    const container = document.getElementById("swaparr_quality_patterns_tags");

    if (!input || !container) return;

    const value = input.value.trim().toLowerCase();
    if (!value) return;

    // Check for duplicates
    const existing = Array.from(container.querySelectorAll(".tag-text")).map(
      (el) => el.textContent.toLowerCase()
    );
    if (existing.includes(value)) {
      input.value = "";
      return;
    }

    this.createTagElement(container, value);
    input.value = "";
  },

  // Get tags from a container
  getTagsFromContainer: function (containerId) {
    const container = document.getElementById(containerId);
    if (!container) return [];

    return Array.from(container.querySelectorAll(".tag-text")).map(
      (el) => el.textContent
    );
  },

  // Load Swaparr GitHub star count dynamically
  loadSwaparrStarCount: function () {
    const starsElement = document.getElementById("swaparr-stars-count");
    if (!starsElement) return;

    // First, try to load from cache immediately for fast display
    const cachedData = localStorage.getItem("swaparr-github-stars");
    if (cachedData) {
      try {
        const parsed = JSON.parse(cachedData);
        if (parsed.stars !== undefined) {
          starsElement.textContent = parsed.stars.toLocaleString();
          // If cache is recent (less than 1 hour), skip API call
          const cacheAge = Date.now() - (parsed.timestamp || 0);
          if (cacheAge < 3600000) {
            // 1 hour = 3600000ms
            return;
          }
        }
      } catch (e) {
        console.warn("Invalid cached Swaparr star data, will fetch fresh");
        localStorage.removeItem("swaparr-github-stars");
      }
    }

    starsElement.textContent = "Loading...";

    // GitHub API endpoint for Swaparr repository
    const apiUrl = "https://api.github.com/repos/ThijmenGThN/swaparr";

    HuntarrUtils.fetchWithTimeout(apiUrl)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`GitHub API error: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        if (data && data.stargazers_count !== undefined) {
          // Format the number with commas for thousands
          const formattedStars = data.stargazers_count.toLocaleString();
          starsElement.textContent = formattedStars;

          // Store in localStorage to avoid excessive API requests
          const cacheData = {
            stars: data.stargazers_count,
            timestamp: Date.now(),
          };
          localStorage.setItem(
            "swaparr-github-stars",
            JSON.stringify(cacheData)
          );
        } else {
          throw new Error("Star count not found in response");
        }
      })
      .catch((error) => {
        console.error("Error fetching Swaparr GitHub stars:", error);

        // Try to load from cache if we have it
        const cachedData = localStorage.getItem("swaparr-github-stars");
        if (cachedData) {
          try {
            const parsed = JSON.parse(cachedData);
            if (parsed.stars !== undefined) {
              starsElement.textContent = parsed.stars.toLocaleString();
            } else {
              starsElement.textContent = "172"; // Fallback to known value
            }
          } catch (e) {
            console.error("Failed to parse cached Swaparr star data:", e);
            starsElement.textContent = "172"; // Fallback to known value
            localStorage.removeItem("swaparr-github-stars"); // Clear bad cache
          }
        } else {
          starsElement.textContent = "172"; // Fallback to known value
        }
      });
  },

  // Format date nicely for display
  formatDate: function (date) {
    if (!date) return "Never";

    const options = {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    };

    return date.toLocaleString("en-US", options);
  },

  // Convert seconds to readable format
  convertSecondsToReadable: function (seconds) {
    if (!seconds || seconds <= 0) return "0 seconds";

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    const parts = [];
    if (hours > 0) parts.push(`${hours} hour${hours > 1 ? "s" : ""}`);
    if (minutes > 0) parts.push(`${minutes} minute${minutes > 1 ? "s" : ""}`);
    if (remainingSeconds > 0 && hours === 0)
      parts.push(
        `${remainingSeconds} second${remainingSeconds > 1 ? "s" : ""}`
      );

    return parts.join(", ") || "0 seconds";
  },

  // Get settings from form
  getFormSettings: function (container, appType) {
    let settings = {};

    // Helper function to get input value with fallback
    function getInputValue(selector, defaultValue) {
      const element = container.querySelector(selector);
      if (!element) return defaultValue;

      if (element.type === "checkbox") {
        return element.checked;
      } else if (element.type === "number") {
        const parsedValue = parseInt(element.value);
        return !isNaN(parsedValue) ? parsedValue : defaultValue;
      } else {
        return element.value || defaultValue;
      }
    }

    // For the general settings form, collect settings including advanced settings
    if (appType === "general") {
      console.log("Processing general settings");
      console.log("Container:", container);
      console.log(
        "Container HTML (first 500 chars):",
        container.innerHTML.substring(0, 500)
      );

      // Debug: Check if apprise_urls exists anywhere
      const globalAppriseElement = document.querySelector("#apprise_urls");
      console.log("Global apprise_urls element:", globalAppriseElement);

      settings.instances = [];
      settings.timezone = getInputValue("#timezone", "UTC");
      settings.check_for_updates = getInputValue("#check_for_updates", true);
      settings.display_community_resources = getInputValue(
        "#display_community_resources",
        true
      );
      settings.display_huntarr_support = getInputValue(
        "#display_huntarr_support",
        true
      );
      settings.low_usage_mode = getInputValue("#low_usage_mode", false);

      // Auth mode handling
      const authModeElement = container.querySelector("#auth_mode");
      if (authModeElement) {
        settings.auth_mode = authModeElement.value;
      }

      settings.ssl_verify = getInputValue("#ssl_verify", true);
      settings.api_timeout = getInputValue("#api_timeout", 120);
      settings.command_wait_delay = getInputValue("#command_wait_delay", 1);
      settings.command_wait_attempts = getInputValue(
        "#command_wait_attempts",
        600
      );
      settings.minimum_download_queue_size = getInputValue(
        "#minimum_download_queue_size",
        -1
      );
      settings.log_refresh_interval_seconds = getInputValue(
        "#log_refresh_interval_seconds",
        30
      );
      settings.base_url = getInputValue("#base_url", "");

      // Notification settings - check both container and notifications container
      const notificationsContainer = document.querySelector(
        "#notificationsContainer"
      );

      // Helper function to get input value from either container
      const getNotificationInputValue = (id, defaultValue) => {
        let element = container.querySelector(id);
        if (!element && notificationsContainer) {
          element = notificationsContainer.querySelector(id);
        }

        if (!element) {
          console.log(
            `Notification element ${id} not found in either container`
          );
          return defaultValue;
        }

        if (element.type === "checkbox") {
          return element.checked;
        } else if (element.type === "number") {
          const value = parseInt(element.value, 10);
          return isNaN(value) ? defaultValue : value;
        } else {
          return element.value || defaultValue;
        }
      };

      settings.enable_notifications = getNotificationInputValue(
        "#enable_notifications",
        false
      );
      settings.notification_level = getNotificationInputValue(
        "#notification_level",
        "info"
      );

      // Process apprise URLs (split by newline) - check notifications container first
      let appriseUrlsElement = notificationsContainer
        ? notificationsContainer.querySelector("#apprise_urls")
        : null;
      if (!appriseUrlsElement) {
        appriseUrlsElement = container.querySelector("#apprise_urls");
      }
      console.log("Apprise URLs element found:", appriseUrlsElement);
      const appriseUrlsText = appriseUrlsElement?.value || "";
      console.log("Apprise URLs raw text:", appriseUrlsText);
      settings.apprise_urls = appriseUrlsText
        .split("\n")
        .map((url) => url.trim())
        .filter((url) => url.length > 0);
      console.log("Apprise URLs processed:", settings.apprise_urls);

      settings.notify_on_missing = getNotificationInputValue(
        "#notify_on_missing",
        true
      );
      settings.notify_on_upgrade = getNotificationInputValue(
        "#notify_on_upgrade",
        true
      );
      settings.notification_include_instance = getNotificationInputValue(
        "#notification_include_instance",
        true
      );
      settings.notification_include_app = getNotificationInputValue(
        "#notification_include_app",
        true
      );

      // Handle the auth_mode dropdown
      const authMode = container.querySelector("#auth_mode")?.value || "login";

      // Save the auth_mode value directly
      settings.auth_mode = authMode;

      // Set the appropriate flags based on the selected auth mode
      switch (authMode) {
        case "local_bypass":
          settings.local_access_bypass = true;
          settings.proxy_auth_bypass = false;
          break;
        case "no_login":
          settings.local_access_bypass = false;
          settings.proxy_auth_bypass = true;
          break;
        case "login":
        default:
          settings.local_access_bypass = false;
          settings.proxy_auth_bypass = false;
          break;
      }
    }

    // For other app types, collect settings
    else {
      // Handle instances differently
      const instances = [];
      // Find instance containers with both old and new class names
      const instanceContainers = container.querySelectorAll(
        ".instance-item, .instance-panel"
      );

      // Collect instance data with improved error handling
      instanceContainers.forEach((instance, index) => {
        const nameInput = instance.querySelector('input[name="name"]');
        const urlInput = instance.querySelector('input[name="api_url"]');
        const keyInput = instance.querySelector('input[name="api_key"]');
        const enabledInput = instance.querySelector('input[name="enabled"]');
        const swaparrEnabledInput = instance.querySelector(
          'input[name="swaparr_enabled"]'
        );

        // Get per-instance missing/upgrade values
        const huntMissingItemsInput =
          instance.querySelector('input[name="hunt_missing_items"]') ||
          instance.querySelector('input[name="hunt_missing_movies"]') ||
          instance.querySelector('input[name="hunt_missing_books"]');
        const huntUpgradeItemsInput =
          instance.querySelector('input[name="hunt_upgrade_items"]') ||
          instance.querySelector('input[name="hunt_upgrade_movies"]') ||
          instance.querySelector('input[name="hunt_upgrade_books"]');

        // Get per-instance mode settings (for Sonarr)
        const huntMissingModeInput = instance.querySelector(
          'select[name="hunt_missing_mode"]'
        );
        const upgradeModeInput = instance.querySelector(
          'select[name="upgrade_mode"]'
        );

        // Get per-instance state management settings (for Sonarr)
        const stateManagementModeInput = instance.querySelector(
          'select[name="state_management_mode"]'
        );
        const stateManagementHoursInput = instance.querySelector(
          'input[name="state_management_hours"]'
        );

        // Get quality profile selectors for Radarr
        const missingQualityProfileInput = instance.querySelector(
          'select[name="missing_quality_profile"]'
        );
        const upgradeQualityProfileInput = instance.querySelector(
          'select[name="upgrade_quality_profile"]'
        );

        const name = nameInput ? nameInput.value : null;
        const url = urlInput ? urlInput.value : null;
        const key = keyInput ? keyInput.value : null;
        const enabled = enabledInput ? enabledInput.checked : true; // Default to enabled if checkbox not found
        const swaparrEnabled = swaparrEnabledInput
          ? swaparrEnabledInput.checked
          : false; // Default to disabled

        // Get per-instance hunt values (default: missing=1, upgrade=0)
        const huntMissingItems = huntMissingItemsInput
          ? parseInt(huntMissingItemsInput.value) || 0
          : 1;
        const huntUpgradeItems = huntUpgradeItemsInput
          ? parseInt(huntUpgradeItemsInput.value) || 0
          : 0;

        // Quality profile selections removed - not functional

        if (!name || !url || !key) {
          console.warn(`Instance ${index} is missing required fields`);
        }

        const instanceObj = {
          name: name || `Instance ${index + 1}`,
          api_url: url || "",
          api_key: key || "",
          enabled: enabled,
          swaparr_enabled: swaparrEnabled,
        };

        // Add per-instance missing/upgrade settings for apps that support it
        if (appType === "sonarr") {
          instanceObj.hunt_missing_items = huntMissingItems;
          instanceObj.hunt_upgrade_items = huntUpgradeItems;
          instanceObj.hunt_missing_mode = huntMissingModeInput
            ? huntMissingModeInput.value
            : "seasons_packs";
          instanceObj.upgrade_mode = upgradeModeInput
            ? upgradeModeInput.value
            : "seasons_packs";
          instanceObj.state_management_mode = stateManagementModeInput
            ? stateManagementModeInput.value
            : "custom";
          instanceObj.state_management_hours = stateManagementHoursInput
            ? parseInt(stateManagementHoursInput.value) || 168
            : 168;

          // Add air date delay setting
          const airDateDelayInput = instance.querySelector(
            'input[name="air_date_delay_days"]'
          );
          instanceObj.air_date_delay_days = airDateDelayInput
            ? parseInt(airDateDelayInput.value) || 0
            : 0;
        } else if (appType === "radarr") {
          instanceObj.hunt_missing_movies = huntMissingItems;
          instanceObj.hunt_upgrade_movies = huntUpgradeItems;
          instanceObj.state_management_mode = stateManagementModeInput
            ? stateManagementModeInput.value
            : "custom";
          instanceObj.state_management_hours = stateManagementHoursInput
            ? parseInt(stateManagementHoursInput.value) || 168
            : 168;
          
          // Add release date delay setting
          const releaseDateDelayInput = instance.querySelector('input[name="release_date_delay_days"]');
          instanceObj.release_date_delay_days = releaseDateDelayInput ? parseInt(releaseDateDelayInput.value) || 0 : 0;
        } else if (appType === "lidarr") {
          instanceObj.hunt_missing_items = huntMissingItems;
          instanceObj.hunt_upgrade_items = huntUpgradeItems;
          instanceObj.state_management_mode = stateManagementModeInput
            ? stateManagementModeInput.value
            : "custom";
          instanceObj.state_management_hours = stateManagementHoursInput
            ? parseInt(stateManagementHoursInput.value) || 168
            : 168;
        } else if (appType === "readarr") {
          instanceObj.hunt_missing_books = huntMissingItems;
          instanceObj.hunt_upgrade_books = huntUpgradeItems;
          instanceObj.state_management_mode = stateManagementModeInput
            ? stateManagementModeInput.value
            : "custom";
          instanceObj.state_management_hours = stateManagementHoursInput
            ? parseInt(stateManagementHoursInput.value) || 168
            : 168;
        } else if (appType === "whisparr") {
          instanceObj.hunt_missing_items = huntMissingItems;
          instanceObj.hunt_upgrade_items = huntUpgradeItems;
          instanceObj.state_management_mode = stateManagementModeInput
            ? stateManagementModeInput.value
            : "custom";
          instanceObj.state_management_hours = stateManagementHoursInput
            ? parseInt(stateManagementHoursInput.value) || 168
            : 168;
        } else if (appType === "eros") {
          instanceObj.hunt_missing_items = huntMissingItems;
          instanceObj.hunt_upgrade_items = huntUpgradeItems;
          instanceObj.state_management_mode = stateManagementModeInput
            ? stateManagementModeInput.value
            : "custom";
          instanceObj.state_management_hours = stateManagementHoursInput
            ? parseInt(stateManagementHoursInput.value) || 168
            : 168;
        }

        instances.push(instanceObj);
      });

      // Ensure we always have at least one instance
      if (instances.length === 0) {
        console.warn("No instances found, adding a default empty instance");
        const defaultInstance = {
          name: "Default",
          api_url: "",
          api_key: "",
          enabled: true,
        };

        // Add per-instance missing/upgrade defaults for apps that support it
        if (appType === "sonarr") {
          defaultInstance.hunt_missing_items = 1;
          defaultInstance.hunt_upgrade_items = 0;
          defaultInstance.hunt_missing_mode = "seasons_packs";
          defaultInstance.upgrade_mode = "seasons_packs";
          defaultInstance.state_management_mode = "custom";
          defaultInstance.state_management_hours = 168;
          defaultInstance.missing_quality_profile = "";
          defaultInstance.upgrade_quality_profile = "";
          defaultInstance.air_date_delay_days = 0;
        } else if (appType === "radarr") {
          defaultInstance.hunt_missing_movies = 1;
          defaultInstance.hunt_upgrade_movies = 0;
          defaultInstance.state_management_mode = "custom";
          defaultInstance.state_management_hours = 168;
          defaultInstance.missing_quality_profile = "";
          defaultInstance.upgrade_quality_profile = "";
          defaultInstance.release_date_delay_days = 0;
        } else if (appType === "lidarr") {
          defaultInstance.hunt_missing_items = 1;
          defaultInstance.hunt_upgrade_items = 0;
          defaultInstance.state_management_mode = "custom";
          defaultInstance.state_management_hours = 168;
          defaultInstance.missing_quality_profile = "";
          defaultInstance.upgrade_quality_profile = "";
        } else if (appType === "readarr") {
          defaultInstance.hunt_missing_books = 1;
          defaultInstance.hunt_upgrade_books = 0;
          defaultInstance.state_management_mode = "custom";
          defaultInstance.state_management_hours = 168;
          defaultInstance.missing_quality_profile = "";
          defaultInstance.upgrade_quality_profile = "";
        } else if (appType === "whisparr") {
          defaultInstance.hunt_missing_items = 1;
          defaultInstance.hunt_upgrade_items = 0;
          defaultInstance.state_management_mode = "custom";
          defaultInstance.state_management_hours = 168;
          defaultInstance.missing_quality_profile = "";
          defaultInstance.upgrade_quality_profile = "";
        } else if (appType === "eros") {
          defaultInstance.hunt_missing_items = 1;
          defaultInstance.hunt_upgrade_items = 0;
          defaultInstance.state_management_mode = "custom";
          defaultInstance.state_management_hours = 168;
          defaultInstance.missing_quality_profile = "";
          defaultInstance.upgrade_quality_profile = "";
        }

        instances.push(defaultInstance);
      }

      settings.instances = instances;

      // Add app-specific settings
      if (appType === "sonarr") {
        settings.sleep_duration =
          getInputValue("#sonarr_sleep_duration", 15) * 60; // Convert minutes to seconds
        settings.hourly_cap = getInputValue("#sonarr_hourly_cap", 20);
        settings.monitored_only = getInputValue("#sonarr_monitored_only", true);
        settings.skip_future_episodes = getInputValue(
          "#sonarr_skip_future_episodes",
          true
        );
        settings.tag_processed_items = getInputValue(
          "#sonarr_tag_processed_items",
          true
        );

        // Custom tags
        settings.custom_tags = {
          missing: getInputValue(
            "#sonarr_custom_tag_missing",
            "huntarr-missing"
          ),
          upgrade: getInputValue(
            "#sonarr_custom_tag_upgrade",
            "huntarr-upgrade"
          ),
          shows_missing: getInputValue(
            "#sonarr_custom_tag_shows_missing",
            "huntarr-shows-missing"
          ),
        };
      } else if (appType === "radarr") {
        settings.sleep_duration =
          getInputValue("#radarr_sleep_duration", 15) * 60; // Convert minutes to seconds
        settings.hourly_cap = getInputValue("#radarr_hourly_cap", 20);
        settings.monitored_only = getInputValue("#radarr_monitored_only", true);
        settings.skip_future_releases = getInputValue(
          "#radarr_skip_future_releases",
          true
        );
        settings.process_no_release_dates = getInputValue(
          "#radarr_process_no_release_dates",
          false
        );
        settings.tag_processed_items = getInputValue(
          "#radarr_tag_processed_items",
          true
        );

        // Custom tags
        settings.custom_tags = {
          missing: getInputValue(
            "#radarr_custom_tag_missing",
            "huntarr-missing"
          ),
          upgrade: getInputValue(
            "#radarr_custom_tag_upgrade",
            "huntarr-upgrade"
          ),
        };
      } else if (appType === "lidarr") {
        settings.hunt_missing_mode = getInputValue(
          "#lidarr_hunt_missing_mode",
          "album"
        );
        settings.monitored_only = getInputValue("#lidarr_monitored_only", true);
        settings.skip_future_releases = getInputValue(
          "#lidarr_skip_future_releases",
          true
        );
        settings.sleep_duration =
          getInputValue("#lidarr_sleep_duration", 15) * 60; // Convert minutes to seconds
        settings.hourly_cap = getInputValue("#lidarr_hourly_cap", 20);
        settings.tag_processed_items = getInputValue(
          "#lidarr_tag_processed_items",
          true
        );

        // Custom tags
        settings.custom_tags = {
          missing: getInputValue(
            "#lidarr_custom_tag_missing",
            "huntarr-missing"
          ),
          upgrade: getInputValue(
            "#lidarr_custom_tag_upgrade",
            "huntarr-upgrade"
          ),
        };
      } else if (appType === "readarr") {
        settings.monitored_only = getInputValue(
          "#readarr_monitored_only",
          true
        );
        settings.skip_future_releases = getInputValue(
          "#readarr_skip_future_releases",
          true
        );
        settings.tag_processed_items = getInputValue(
          "#readarr_tag_processed_items",
          true
        );

        settings.sleep_duration =
          getInputValue("#readarr_sleep_duration", 15) * 60; // Convert minutes to seconds
        settings.hourly_cap = getInputValue("#readarr_hourly_cap", 20);

        // Custom tags
        settings.custom_tags = {
          missing: getInputValue(
            "#readarr_custom_tag_missing",
            "huntarr-missing"
          ),
          upgrade: getInputValue(
            "#readarr_custom_tag_upgrade",
            "huntarr-upgrade"
          ),
        };
      } else if (appType === "whisparr") {
        settings.monitored_only = getInputValue(
          "#whisparr_monitored_only",
          true
        );
        settings.whisparr_version = getInputValue(
          "#whisparr-api-version",
          "v3"
        );
        settings.skip_future_releases = getInputValue(
          "#whisparr_skip_future_releases",
          true
        );
        settings.tag_processed_items = getInputValue(
          "#whisparr_tag_processed_items",
          true
        );

        settings.sleep_duration =
          getInputValue("#whisparr_sleep_duration", 15) * 60; // Convert minutes to seconds
        settings.hourly_cap = getInputValue("#whisparr_hourly_cap", 20);

        // Custom tags
        settings.custom_tags = {
          missing: getInputValue(
            "#whisparr_custom_tag_missing",
            "huntarr-missing"
          ),
          upgrade: getInputValue(
            "#whisparr_custom_tag_upgrade",
            "huntarr-upgrade"
          ),
        };
      } else if (appType === "eros") {
        settings.search_mode = getInputValue("#eros_search_mode", "movie");
        settings.monitored_only = getInputValue("#eros_monitored_only", true);
        settings.skip_future_releases = getInputValue(
          "#eros_skip_future_releases",
          true
        );
        settings.tag_processed_items = getInputValue(
          "#eros_tag_processed_items",
          true
        );

        settings.sleep_duration =
          getInputValue("#eros_sleep_duration", 15) * 60; // Convert minutes to seconds
        settings.hourly_cap = getInputValue("#eros_hourly_cap", 20);

        // Custom tags
        settings.custom_tags = {
          missing: getInputValue("#eros_custom_tag_missing", "huntarr-missing"),
          upgrade: getInputValue("#eros_custom_tag_upgrade", "huntarr-upgrade"),
        };
      } else if (appType === "swaparr") {
        // Swaparr doesn't use instances, so set empty array
        settings.instances = [];

        settings.enabled = getInputValue("#swaparr_enabled", false);
        settings.max_strikes = getInputValue("#swaparr_max_strikes", 3);
        settings.max_download_time = getInputValue(
          "#swaparr_max_download_time",
          "2h"
        );
        settings.ignore_above_size = getInputValue(
          "#swaparr_ignore_above_size",
          "25GB"
        );
        settings.remove_from_client = getInputValue(
          "#swaparr_remove_from_client",
          true
        );
        settings.research_removed = getInputValue(
          "#swaparr_research_removed",
          false
        );
        settings.failed_import_detection = getInputValue(
          "#swaparr_failed_import_detection",
          false
        );
        settings.dry_run = getInputValue("#swaparr_dry_run", false);
        settings.sleep_duration =
          getInputValue("#swaparr_sleep_duration", 15) * 60; // Convert minutes to seconds

        // Malicious file detection settings
        settings.malicious_file_detection = getInputValue(
          "#swaparr_malicious_detection",
          false
        );

        // Get tags from tag containers
        settings.malicious_extensions = this.getTagsFromContainer(
          "swaparr_malicious_extensions_tags"
        );
        settings.suspicious_patterns = this.getTagsFromContainer(
          "swaparr_suspicious_patterns_tags"
        );

        // Age-based removal settings
        settings.age_based_removal = getInputValue(
          "#swaparr_age_based_removal",
          false
        );
        settings.max_age_days = getInputValue("#swaparr_max_age_days", 7);

        // Quality-based removal settings
        settings.quality_based_removal = getInputValue(
          "#swaparr_quality_based_removal",
          false
        );
        settings.blocked_quality_patterns = this.getTagsFromContainer(
          "swaparr_quality_patterns_tags"
        );
      } else if (appType === "prowlarr") {
        // Prowlarr doesn't use instances array, store directly
        settings.instances = [];

        settings.enabled = getInputValue("#prowlarr-enabled-0", true);
        settings.name = "Prowlarr"; // Fixed name since Prowlarr is always single instance
        settings.api_url = getInputValue("#prowlarr-url-0", "");
        settings.api_key = getInputValue("#prowlarr-key-0", "");
      }
    }

    console.log("Collected settings for", appType, settings);
    return settings;
  },

  // Generate General settings form
  generateGeneralForm: function (container, settings = {}) {
    // Add data-app-type attribute to container
    container.setAttribute("data-app-type", "general");

    container.innerHTML = `
            <div class="settings-group" style="
                background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%);
                border: 2px solid rgba(90, 109, 137, 0.3);
                border-radius: 12px;
                padding: 20px;
                margin: 15px 0 25px 0;
                box-shadow: 0 4px 12px rgba(90, 109, 137, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1);
            ">
                <h3>System Settings</h3>
                <div class="setting-item">
                    <label for="check_for_updates"><a href="https://plexguide.github.io/Huntarr.io/settings/settings.html#check-for-updates" class="info-icon" title="Learn more about update checking" target="_blank" rel="noopener"><i class="fas fa-info-circle"></i></a>Check for Updates:</label>
                    <label class="toggle-switch" style="width:40px; height:20px; display:inline-block; position:relative;">
                        <input type="checkbox" id="check_for_updates" ${
                          settings.check_for_updates !== false ? "checked" : ""
                        }>
                        <span class="toggle-slider" style="position:absolute; cursor:pointer; top:0; left:0; right:0; bottom:0; background-color:#3d4353; border-radius:20px; transition:0.4s;"></span>
                    </label>
                    <p class="setting-help" style="margin-left: -3ch !important;">Automatically check for Huntarr updates</p>
                </div>

                <div class="setting-item">
                    <label for="low_usage_mode"><a href="https://plexguide.github.io/Huntarr.io/settings/settings.html#low-usage-mode" class="info-icon" title="Learn more about Low Usage Mode" target="_blank" rel="noopener"><i class="fas fa-info-circle"></i></a>Low Usage Mode:</label>
                    <label class="toggle-switch" style="width:40px; height:20px; display:inline-block; position:relative;">
                        <input type="checkbox" id="low_usage_mode" ${
                          settings.low_usage_mode === true ? "checked" : ""
                        }>
                        <span class="toggle-slider" style="position:absolute; cursor:pointer; top:0; left:0; right:0; bottom:0; background-color:#3d4353; border-radius:20px; transition:0.4s;"></span>
                    </label>
                    <p class="setting-help" style="margin-left: -3ch !important;">Disables animations to reduce CPU/GPU usage on older devices</p>
                </div>
                <div class="setting-item">
                    <label for="timezone"><a href="https://plexguide.github.io/Huntarr.io/settings/settings.html#timezone" class="info-icon" title="Set your timezone for accurate time display" target="_blank" rel="noopener"><i class="fas fa-info-circle"></i></a>Timezone:</label>
                    <select id="timezone" name="timezone" style="width: 300px; padding: 8px 12px; border-radius: 6px; cursor: pointer; border: 1px solid rgba(255, 255, 255, 0.1); background-color: #1f2937; color: #d1d5db;">
                        ${(() => {
                          // Check if current timezone is in our predefined list
                          const predefinedTimezones = [
                            "UTC",
                            "America/New_York",
                            "America/Chicago",
                            "America/Denver",
                            "America/Los_Angeles",
                            "Pacific/Honolulu",
                            "America/Toronto",
                            "America/Vancouver",
                            "America/Sao_Paulo",
                            "America/Argentina/Buenos_Aires",
                            "America/Mexico_City",
                            "America/Phoenix",
                            "America/Anchorage",
                            "America/Halifax",
                            "America/St_Johns",
                            "America/Lima",
                            "America/Bogota",
                            "America/Caracas",
                            "America/Santiago",
                            "America/La_Paz",
                            "Europe/London",
                            "Europe/Paris",
                            "Europe/Berlin",
                            "Europe/Amsterdam",
                            "Europe/Rome",
                            "Europe/Madrid",
                            "Europe/Stockholm",
                            "Europe/Zurich",
                            "Europe/Vienna",
                            "Europe/Prague",
                            "Europe/Warsaw",
                            "Europe/Budapest",
                            "Europe/Bucharest",
                            "Europe/Sofia",
                            "Europe/Athens",
                            "Europe/Helsinki",
                            "Europe/Oslo",
                            "Europe/Copenhagen",
                            "Europe/Brussels",
                            "Europe/Lisbon",
                            "Europe/Dublin",
                            "Europe/Moscow",
                            "Europe/Kiev",
                            "Europe/Minsk",
                            "Europe/Riga",
                            "Europe/Tallinn",
                            "Europe/Vilnius",
                            "Africa/Cairo",
                            "Africa/Lagos",
                            "Africa/Nairobi",
                            "Africa/Casablanca",
                            "Africa/Johannesburg",
                            "Asia/Dubai",
                            "Asia/Qatar",
                            "Asia/Kuwait",
                            "Asia/Riyadh",
                            "Asia/Tehran",
                            "Asia/Tashkent",
                            "Asia/Almaty",
                            "Asia/Tokyo",
                            "Asia/Seoul",
                            "Asia/Shanghai",
                            "Asia/Hong_Kong",
                            "Asia/Singapore",
                            "Asia/Bangkok",
                            "Asia/Kolkata",
                            "Asia/Karachi",
                            "Asia/Jakarta",
                            "Asia/Manila",
                            "Asia/Kuala_Lumpur",
                            "Asia/Taipei",
                            "Asia/Yekaterinburg",
                            "Australia/Sydney",
                            "Australia/Melbourne",
                            "Australia/Brisbane",
                            "Australia/Adelaide",
                            "Australia/Perth",
                            "Pacific/Auckland",
                            "Pacific/Fiji",
                            "Pacific/Guam",
                          ];
                          const currentTimezone = settings.timezone;

                          if (
                            currentTimezone &&
                            !predefinedTimezones.includes(currentTimezone)
                          ) {
                            // Add custom timezone option at the top
                            return `<option value="${currentTimezone}" selected>${currentTimezone} (Custom from Environment)</option>`;
                          }
                          return "";
                        })()}
                        <option value="UTC" ${
                          settings.timezone === "UTC" || !settings.timezone
                            ? "selected"
                            : ""
                        }>UTC (Coordinated Universal Time)</option>
                        <option value="America/New_York" ${
                          settings.timezone === "America/New_York"
                            ? "selected"
                            : ""
                        }>Eastern Time (America/New_York)</option>
                        <option value="America/Chicago" ${
                          settings.timezone === "America/Chicago"
                            ? "selected"
                            : ""
                        }>Central Time (America/Chicago)</option>
                        <option value="America/Denver" ${
                          settings.timezone === "America/Denver"
                            ? "selected"
                            : ""
                        }>Mountain Time (America/Denver)</option>
                        <option value="America/Los_Angeles" ${
                          settings.timezone === "America/Los_Angeles"
                            ? "selected"
                            : ""
                        }>Pacific Time (America/Los_Angeles)</option>
                        <option value="Pacific/Honolulu" ${
                          settings.timezone === "Pacific/Honolulu"
                            ? "selected"
                            : ""
                        }>Hawaii Time (Pacific/Honolulu)</option>
                        <option value="America/Toronto" ${
                          settings.timezone === "America/Toronto"
                            ? "selected"
                            : ""
                        }>Eastern Canada (America/Toronto)</option>
                        <option value="America/Vancouver" ${
                          settings.timezone === "America/Vancouver"
                            ? "selected"
                            : ""
                        }>Pacific Canada (America/Vancouver)</option>
                        <option value="America/Sao_Paulo" ${
                          settings.timezone === "America/Sao_Paulo"
                            ? "selected"
                            : ""
                        }>Brazil (America/Sao_Paulo)</option>
                        <option value="America/Argentina/Buenos_Aires" ${
                          settings.timezone === "America/Argentina/Buenos_Aires"
                            ? "selected"
                            : ""
                        }>Argentina (America/Argentina/Buenos_Aires)</option>
                        <option value="America/Mexico_City" ${
                          settings.timezone === "America/Mexico_City"
                            ? "selected"
                            : ""
                        }>Mexico (America/Mexico_City)</option>
                        <option value="America/Phoenix" ${
                          settings.timezone === "America/Phoenix"
                            ? "selected"
                            : ""
                        }>Arizona (America/Phoenix)</option>
                        <option value="America/Anchorage" ${
                          settings.timezone === "America/Anchorage"
                            ? "selected"
                            : ""
                        }>Alaska (America/Anchorage)</option>
                        <option value="America/Halifax" ${
                          settings.timezone === "America/Halifax"
                            ? "selected"
                            : ""
                        }>Atlantic Canada (America/Halifax)</option>
                        <option value="America/St_Johns" ${
                          settings.timezone === "America/St_Johns"
                            ? "selected"
                            : ""
                        }>Newfoundland (America/St_Johns)</option>
                        <option value="America/Lima" ${
                          settings.timezone === "America/Lima" ? "selected" : ""
                        }>Peru (America/Lima)</option>
                        <option value="America/Bogota" ${
                          settings.timezone === "America/Bogota"
                            ? "selected"
                            : ""
                        }>Colombia (America/Bogota)</option>
                        <option value="America/Caracas" ${
                          settings.timezone === "America/Caracas"
                            ? "selected"
                            : ""
                        }>Venezuela (America/Caracas)</option>
                        <option value="America/Santiago" ${
                          settings.timezone === "America/Santiago"
                            ? "selected"
                            : ""
                        }>Chile (America/Santiago)</option>
                        <option value="America/La_Paz" ${
                          settings.timezone === "America/La_Paz"
                            ? "selected"
                            : ""
                        }>Bolivia (America/La_Paz)</option>
                        <option value="Europe/London" ${
                          settings.timezone === "Europe/London"
                            ? "selected"
                            : ""
                        }>UK Time (Europe/London)</option>
                        <option value="Europe/Paris" ${
                          settings.timezone === "Europe/Paris" ? "selected" : ""
                        }>Central Europe (Europe/Paris)</option>
                        <option value="Europe/Berlin" ${
                          settings.timezone === "Europe/Berlin"
                            ? "selected"
                            : ""
                        }>Germany (Europe/Berlin)</option>
                        <option value="Europe/Amsterdam" ${
                          settings.timezone === "Europe/Amsterdam"
                            ? "selected"
                            : ""
                        }>Netherlands (Europe/Amsterdam)</option>
                        <option value="Europe/Rome" ${
                          settings.timezone === "Europe/Rome" ? "selected" : ""
                        }>Italy (Europe/Rome)</option>
                        <option value="Europe/Madrid" ${
                          settings.timezone === "Europe/Madrid"
                            ? "selected"
                            : ""
                        }>Spain (Europe/Madrid)</option>
                        <option value="Europe/Stockholm" ${
                          settings.timezone === "Europe/Stockholm"
                            ? "selected"
                            : ""
                        }>Sweden (Europe/Stockholm)</option>
                        <option value="Europe/Zurich" ${
                          settings.timezone === "Europe/Zurich"
                            ? "selected"
                            : ""
                        }>Switzerland (Europe/Zurich)</option>
                        <option value="Europe/Vienna" ${
                          settings.timezone === "Europe/Vienna"
                            ? "selected"
                            : ""
                        }>Austria (Europe/Vienna)</option>
                        <option value="Europe/Prague" ${
                          settings.timezone === "Europe/Prague"
                            ? "selected"
                            : ""
                        }>Czech Republic (Europe/Prague)</option>
                        <option value="Europe/Warsaw" ${
                          settings.timezone === "Europe/Warsaw"
                            ? "selected"
                            : ""
                        }>Poland (Europe/Warsaw)</option>
                        <option value="Europe/Budapest" ${
                          settings.timezone === "Europe/Budapest"
                            ? "selected"
                            : ""
                        }>Hungary (Europe/Budapest)</option>
                        <option value="Europe/Bucharest" ${
                          settings.timezone === "Europe/Bucharest"
                            ? "selected"
                            : ""
                        }>Romania (Europe/Bucharest)</option>
                        <option value="Europe/Sofia" ${
                          settings.timezone === "Europe/Sofia" ? "selected" : ""
                        }>Bulgaria (Europe/Sofia)</option>
                        <option value="Europe/Athens" ${
                          settings.timezone === "Europe/Athens"
                            ? "selected"
                            : ""
                        }>Greece (Europe/Athens)</option>
                        <option value="Europe/Helsinki" ${
                          settings.timezone === "Europe/Helsinki"
                            ? "selected"
                            : ""
                        }>Finland (Europe/Helsinki)</option>
                        <option value="Europe/Oslo" ${
                          settings.timezone === "Europe/Oslo" ? "selected" : ""
                        }>Norway (Europe/Oslo)</option>
                        <option value="Europe/Copenhagen" ${
                          settings.timezone === "Europe/Copenhagen"
                            ? "selected"
                            : ""
                        }>Denmark (Europe/Copenhagen)</option>
                        <option value="Europe/Brussels" ${
                          settings.timezone === "Europe/Brussels"
                            ? "selected"
                            : ""
                        }>Belgium (Europe/Brussels)</option>
                        <option value="Europe/Lisbon" ${
                          settings.timezone === "Europe/Lisbon"
                            ? "selected"
                            : ""
                        }>Portugal (Europe/Lisbon)</option>
                        <option value="Europe/Dublin" ${
                          settings.timezone === "Europe/Dublin"
                            ? "selected"
                            : ""
                        }>Ireland (Europe/Dublin)</option>
                        <option value="Europe/Moscow" ${
                          settings.timezone === "Europe/Moscow"
                            ? "selected"
                            : ""
                        }>Russia Moscow (Europe/Moscow)</option>
                        <option value="Europe/Kiev" ${
                          settings.timezone === "Europe/Kiev" ? "selected" : ""
                        }>Ukraine (Europe/Kiev)</option>
                        <option value="Europe/Minsk" ${
                          settings.timezone === "Europe/Minsk" ? "selected" : ""
                        }>Belarus (Europe/Minsk)</option>
                        <option value="Europe/Riga" ${
                          settings.timezone === "Europe/Riga" ? "selected" : ""
                        }>Latvia (Europe/Riga)</option>
                        <option value="Europe/Tallinn" ${
                          settings.timezone === "Europe/Tallinn"
                            ? "selected"
                            : ""
                        }>Estonia (Europe/Tallinn)</option>
                        <option value="Europe/Vilnius" ${
                          settings.timezone === "Europe/Vilnius"
                            ? "selected"
                            : ""
                        }>Lithuania (Europe/Vilnius)</option>
                        <option value="Africa/Cairo" ${
                          settings.timezone === "Africa/Cairo" ? "selected" : ""
                        }>Egypt (Africa/Cairo)</option>
                        <option value="Africa/Lagos" ${
                          settings.timezone === "Africa/Lagos" ? "selected" : ""
                        }>Nigeria (Africa/Lagos)</option>
                        <option value="Africa/Nairobi" ${
                          settings.timezone === "Africa/Nairobi"
                            ? "selected"
                            : ""
                        }>Kenya (Africa/Nairobi)</option>
                        <option value="Africa/Casablanca" ${
                          settings.timezone === "Africa/Casablanca"
                            ? "selected"
                            : ""
                        }>Morocco (Africa/Casablanca)</option>
                        <option value="Africa/Johannesburg" ${
                          settings.timezone === "Africa/Johannesburg"
                            ? "selected"
                            : ""
                        }>South Africa (Africa/Johannesburg)</option>
                        <option value="Asia/Dubai" ${
                          settings.timezone === "Asia/Dubai" ? "selected" : ""
                        }>UAE (Asia/Dubai)</option>
                        <option value="Asia/Qatar" ${
                          settings.timezone === "Asia/Qatar" ? "selected" : ""
                        }>Qatar (Asia/Qatar)</option>
                        <option value="Asia/Kuwait" ${
                          settings.timezone === "Asia/Kuwait" ? "selected" : ""
                        }>Kuwait (Asia/Kuwait)</option>
                        <option value="Asia/Riyadh" ${
                          settings.timezone === "Asia/Riyadh" ? "selected" : ""
                        }>Saudi Arabia (Asia/Riyadh)</option>
                        <option value="Asia/Tehran" ${
                          settings.timezone === "Asia/Tehran" ? "selected" : ""
                        }>Iran (Asia/Tehran)</option>
                        <option value="Asia/Tashkent" ${
                          settings.timezone === "Asia/Tashkent"
                            ? "selected"
                            : ""
                        }>Uzbekistan (Asia/Tashkent)</option>
                        <option value="Asia/Almaty" ${
                          settings.timezone === "Asia/Almaty" ? "selected" : ""
                        }>Kazakhstan (Asia/Almaty)</option>
                        <option value="Asia/Tokyo" ${
                          settings.timezone === "Asia/Tokyo" ? "selected" : ""
                        }>Japan (Asia/Tokyo)</option>
                        <option value="Asia/Seoul" ${
                          settings.timezone === "Asia/Seoul" ? "selected" : ""
                        }>South Korea (Asia/Seoul)</option>
                        <option value="Asia/Shanghai" ${
                          settings.timezone === "Asia/Shanghai"
                            ? "selected"
                            : ""
                        }>China (Asia/Shanghai)</option>
                        <option value="Asia/Hong_Kong" ${
                          settings.timezone === "Asia/Hong_Kong"
                            ? "selected"
                            : ""
                        }>Hong Kong (Asia/Hong_Kong)</option>
                        <option value="Asia/Singapore" ${
                          settings.timezone === "Asia/Singapore"
                            ? "selected"
                            : ""
                        }>Singapore (Asia/Singapore)</option>
                        <option value="Asia/Bangkok" ${
                          settings.timezone === "Asia/Bangkok" ? "selected" : ""
                        }>Thailand (Asia/Bangkok)</option>
                        <option value="Asia/Kolkata" ${
                          settings.timezone === "Asia/Kolkata" ? "selected" : ""
                        }>India (Asia/Kolkata)</option>
                        <option value="Asia/Karachi" ${
                          settings.timezone === "Asia/Karachi" ? "selected" : ""
                        }>Pakistan (Asia/Karachi)</option>
                        <option value="Asia/Jakarta" ${
                          settings.timezone === "Asia/Jakarta" ? "selected" : ""
                        }>Indonesia (Asia/Jakarta)</option>
                        <option value="Asia/Manila" ${
                          settings.timezone === "Asia/Manila" ? "selected" : ""
                        }>Philippines (Asia/Manila)</option>
                        <option value="Asia/Kuala_Lumpur" ${
                          settings.timezone === "Asia/Kuala_Lumpur"
                            ? "selected"
                            : ""
                        }>Malaysia (Asia/Kuala_Lumpur)</option>
                        <option value="Asia/Taipei" ${
                          settings.timezone === "Asia/Taipei" ? "selected" : ""
                        }>Taiwan (Asia/Taipei)</option>
                        <option value="Asia/Yekaterinburg" ${
                          settings.timezone === "Asia/Yekaterinburg"
                            ? "selected"
                            : ""
                        }>Russia Yekaterinburg (Asia/Yekaterinburg)</option>
                        <option value="Australia/Sydney" ${
                          settings.timezone === "Australia/Sydney"
                            ? "selected"
                            : ""
                        }>Australia East (Australia/Sydney)</option>
                        <option value="Australia/Melbourne" ${
                          settings.timezone === "Australia/Melbourne"
                            ? "selected"
                            : ""
                        }>Australia Melbourne (Australia/Melbourne)</option>
                        <option value="Australia/Brisbane" ${
                          settings.timezone === "Australia/Brisbane"
                            ? "selected"
                            : ""
                        }>Australia Brisbane (Australia/Brisbane)</option>
                        <option value="Australia/Adelaide" ${
                          settings.timezone === "Australia/Adelaide"
                            ? "selected"
                            : ""
                        }>Australia Adelaide (Australia/Adelaide)</option>
                        <option value="Australia/Perth" ${
                          settings.timezone === "Australia/Perth"
                            ? "selected"
                            : ""
                        }>Australia West (Australia/Perth)</option>
                        <option value="Pacific/Auckland" ${
                          settings.timezone === "Pacific/Auckland"
                            ? "selected"
                            : ""
                        }>New Zealand (Pacific/Auckland)</option>
                        <option value="Pacific/Fiji" ${
                          settings.timezone === "Pacific/Fiji" ? "selected" : ""
                        }>Fiji (Pacific/Fiji)</option>
                        <option value="Pacific/Guam" ${
                          settings.timezone === "Pacific/Guam" ? "selected" : ""
                        }>Guam (Pacific/Guam)</option>
                    </select>
                    <p class="setting-help" style="margin-left: -3ch !important;">Set your timezone for accurate time display in logs and scheduling. Changes are applied immediately.</p>
                </div>
            </div>

            
            <div class="settings-group" style="
                background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%);
                border: 2px solid rgba(90, 109, 137, 0.3);
                border-radius: 12px;
                padding: 20px;
                margin: 15px 0 25px 0;
                box-shadow: 0 4px 12px rgba(90, 109, 137, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1);
            ">
                <h3>Security</h3>
                <div class="setting-item">
                    <label for="auth_mode"><a href="https://plexguide.github.io/Huntarr.io/settings/settings.html#authentication-mode" class="info-icon" title="Learn more about authentication modes" target="_blank" rel="noopener"><i class="fas fa-info-circle"></i></a>Authentication Mode:</label>
                    <select id="auth_mode" name="auth_mode" style="width: 300px; padding: 8px 12px; border-radius: 6px; cursor: pointer; border: 1px solid rgba(255, 255, 255, 0.1); background-color: #1f2937; color: #d1d5db;">
                        <option value="login" ${
                          settings.auth_mode === "login" ||
                          (!settings.auth_mode &&
                            !settings.local_access_bypass &&
                            !settings.proxy_auth_bypass)
                            ? "selected"
                            : ""
                        }>Login Mode</option>
                        <option value="local_bypass" ${
                          settings.auth_mode === "local_bypass" ||
                          (!settings.auth_mode &&
                            settings.local_access_bypass === true &&
                            !settings.proxy_auth_bypass)
                            ? "selected"
                            : ""
                        }>Local Bypass Mode</option>
                        <option value="no_login" ${
                          settings.auth_mode === "no_login" ||
                          (!settings.auth_mode &&
                            settings.proxy_auth_bypass === true)
                            ? "selected"
                            : ""
                        }>No Login Mode</option>
                    </select>
                    <p class="setting-help" style="margin-left: -3ch !important;">
                        <strong>Login Mode:</strong> Standard login required for all connections<br>
                        <strong>Local Bypass Mode:</strong> Only local network connections (192.168.x.x, 10.x.x.x) bypass login<br>
                        <strong>No Login Mode:</strong> Completely disable authentication
                    </p>
                    <p class="setting-help warning" style="color: #ff6b6b; margin-left: -3ch !important;"><strong>Warning:</strong> Only use No Login Mode if your reverse proxy (e.g., Cloudflare, Nginx) is properly securing access!</p>
                </div>
                <div class="setting-item">
                    <label for="ssl_verify"><a href="https://plexguide.github.io/Huntarr.io/settings/settings.html#enable-ssl-verify" class="info-icon" title="Learn more about SSL verification" target="_blank" rel="noopener"><i class="fas fa-info-circle"></i></a>Enable SSL Verify:</label>
                    <label class="toggle-switch" style="width:40px; height:20px; display:inline-block; position:relative;">
                        <input type="checkbox" id="ssl_verify" ${
                          settings.ssl_verify === true ? "checked" : ""
                        }>
                        <span class="toggle-slider" style="position:absolute; cursor:pointer; top:0; left:0; right:0; bottom:0; background-color:#3d4353; border-radius:20px; transition:0.4s;"></span>
                    </label>
                    <p class="setting-help" style="margin-left: -3ch !important;">Disable SSL certificate verification when using self-signed certificates in private networks.</p>
                </div>
            </div>
            
            <div class="settings-group" style="
                background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%);
                border: 2px solid rgba(90, 109, 137, 0.3);
                border-radius: 12px;
                padding: 20px;
                margin: 15px 0 25px 0;
                box-shadow: 0 4px 12px rgba(90, 109, 137, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1);
            ">
                <h3>Advanced Settings</h3>
                <div class="setting-item">
                    <label for="api_timeout"><a href="https://plexguide.github.io/Huntarr.io/settings/settings.html#api-timeout" class="info-icon" title="Learn more about API timeout settings" target="_blank" rel="noopener"><i class="fas fa-info-circle"></i></a>API Timeout:</label>
                    <input type="number" id="api_timeout" min="10" value="${
                      settings.api_timeout !== undefined
                        ? settings.api_timeout
                        : 120
                    }">
                    <p class="setting-help" style="margin-left: -3ch !important;">API request timeout in seconds</p>
                </div>
                <div class="setting-item">
                    <label for="command_wait_delay"><a href="https://plexguide.github.io/Huntarr.io/settings/settings.html#command-wait-delay" class="info-icon" title="Learn more about command wait settings" target="_blank" rel="noopener"><i class="fas fa-info-circle"></i></a>Command Wait Delay:</label>
                    <input type="number" id="command_wait_delay" min="1" value="${
                      settings.command_wait_delay !== undefined
                        ? settings.command_wait_delay
                        : 1
                    }">
                    <p class="setting-help" style="margin-left: -3ch !important;">Delay between command status checks in seconds</p>
                </div>
                <div class="setting-item">
                    <label for="command_wait_attempts"><a href="https://plexguide.github.io/Huntarr.io/settings/settings.html#cmd-wait-attempts" class="info-icon" title="Learn more about command wait settings" target="_blank" rel="noopener"><i class="fas fa-info-circle"></i></a>CMD Wait Attempts:</label>
                    <input type="number" id="command_wait_attempts" min="1" value="${
                      settings.command_wait_attempts !== undefined
                        ? settings.command_wait_attempts
                        : 600
                    }">
                    <p class="setting-help" style="margin-left: -3ch !important;">Maximum number of attempts to check command status</p>
                </div>
                <div class="setting-item">
                    <label for="minimum_download_queue_size"><a href="https://plexguide.github.io/Huntarr.io/settings/settings.html#max-dl-queue-size" class="info-icon" title="Learn more about download queue management" target="_blank" rel="noopener"><i class="fas fa-info-circle"></i></a>Max DL Queue Size:</label>
                    <input type="number" id="minimum_download_queue_size" min="-1" value="${
                      settings.minimum_download_queue_size !== undefined
                        ? settings.minimum_download_queue_size
                        : -1
                    }">
                    <p class="setting-help" style="margin-left: -3ch !important;">If the current download queue for an app instance exceeds this value, downloads will be skipped until the queue reduces. Set to -1 to disable this limit.</span>
                </div>
                <div class="setting-item">
                    <label for="log_refresh_interval_seconds"><a href="https://plexguide.github.io/Huntarr.io/settings/settings.html#log-refresh-interval" class="info-icon" title="Learn more about log settings" target="_blank" rel="noopener"><i class="fas fa-info-circle"></i></a>Log Refresh Interval:</label>
                    <input type="number" id="log_refresh_interval_seconds" min="5" value="${
                      settings.log_refresh_interval_seconds !== undefined
                        ? settings.log_refresh_interval_seconds
                        : 30
                    }">
                    <p class="setting-help" style="margin-left: -3ch !important;">How often Huntarr refreshes logs from apps (seconds)</p>
                </div>
                <div class="setting-item">
                    <label for="base_url"><a href="https://plexguide.github.io/Huntarr.io/settings/settings.html#base-url" class="info-icon" title="Learn more about reverse proxy base URL settings" target="_blank" rel="noopener"><i class="fas fa-info-circle"></i></a>Base URL:</label>
                    <input type="text" id="base_url" value="${
                      settings.base_url || ""
                    }" placeholder="/huntarr">
                    <p class="setting-help" style="margin-left: -3ch !important;">Base URL path for reverse proxy (e.g., '/huntarr'). Leave empty for root path. Can be set automatically using BASE_URL environment variable. Requires restart.</p>
                </div>
            </div>



            <div class="settings-group" style="
                background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%);
                border: 2px solid rgba(90, 109, 137, 0.3);
                border-radius: 12px;
                padding: 20px;
                margin: 15px 0 25px 0;
                box-shadow: 0 4px 12px rgba(90, 109, 137, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1);
            ">
                <h3>Display Settings</h3>
                <div class="setting-item">
                    <label for="display_community_resources"><a href="https://plexguide.github.io/Huntarr.io/settings/settings.html#display-resources" class="info-icon" title="Learn more about resources display options" target="_blank" rel="noopener"><i class="fas fa-info-circle"></i></a>Display Resources:</label>
                    <label class="toggle-switch" style="width:40px; height:20px; display:inline-block; position:relative;">
                        <input type="checkbox" id="display_community_resources" ${
                          settings.display_community_resources !== false
                            ? "checked"
                            : ""
                        }>
                        <span class="toggle-slider" style="position:absolute; cursor:pointer; top:0; left:0; right:0; bottom:0; background-color:#3d4353; border-radius:20px; transition:0.4s;"></span>
                    </label>
                    <p class="setting-help" style="margin-left: -3ch !important;">Show or hide the Resources section on the home page</p>
                </div>
                <div class="setting-item">
                    <label for="display_huntarr_support"><a href="https://plexguide.github.io/Huntarr.io/settings/settings.html#display-huntarr-support" class="info-icon" title="Learn more about Huntarr support display options" target="_blank" rel="noopener"><i class="fas fa-info-circle"></i></a>Display Huntarr Support:</label>
                    <label class="toggle-switch" style="width:40px; height:20px; display:inline-block; position:relative;">
                        <input type="checkbox" id="display_huntarr_support" ${
                          settings.display_huntarr_support !== false
                            ? "checked"
                            : ""
                        }>
                        <span class="toggle-slider" style="position:absolute; cursor:pointer; top:0; left:0; right:0; bottom:0; background-color:#3d4353; border-radius:20px; transition:0.4s;"></span>
                    </label>
                    <p class="setting-help" style="margin-left: -3ch !important;">Display support section to help Huntarr development through GitHub stars and donations</p>
                </div>
            </div>
        `;

    // Add event listener for Display Huntarr Support toggle
    const displayHuntarrSupportToggle = container.querySelector(
      "#display_huntarr_support"
    );
    if (displayHuntarrSupportToggle) {
      displayHuntarrSupportToggle.addEventListener("change", function () {
        if (!this.checked) {
          // Show popup when turning off
          const modal = document.createElement("div");
          modal.className = "modal-overlay";
          modal.style.cssText = `
                        position: fixed;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        background: rgba(0, 0, 0, 0.7);
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        z-index: 10000;
                    `;

          const modalContent = document.createElement("div");
          modalContent.style.cssText = `
                        background: #1f2937;
                        border-radius: 12px;
                        padding: 30px;
                        max-width: 500px;
                        margin: 20px;
                        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
                        border: 1px solid rgba(255, 255, 255, 0.1);
                    `;

          modalContent.innerHTML = `
                        <div style="text-align: center;">
                            <div style="font-size: 48px; margin-bottom: 20px;">⭐</div>
                                                         <h3 style="color: #f3f4f6; margin-bottom: 20px; font-size: 24px;">Support Huntarr Development</h3>
                             <p style="color: #d1d5db; line-height: 1.6; margin-bottom: 25px;">
                                 Huntarr is completely free and open-source with hundreds of hours spent by myself with the support of many others!
                             </p>
                             <p style="color: #d1d5db; line-height: 1.6; margin-bottom: 25px;">
                                 If you enjoy using Huntarr, starring the project on GitHub greatly increases the visibility/advertisement and helps other users discover this tool. It's difficult to spread the word of this tool and means a great deal to me!
                             </p>
                             <p style="color: #60a5fa; line-height: 1.6; margin-bottom: 25px; font-weight: 500;">
                                 If you starred the project, thank you so much! If not, please <a href="https://github.com/plexguide/huntarr" target="_blank" style="color: #60a5fa; text-decoration: underline;">click here</a> and click the ⭐ to help out!
                             </p>
                             <p style="color: #9ca3af; line-height: 1.6; margin-bottom: 30px; font-style: italic; font-size: 14px;">
                                 Thank You ~ Admin9705 (and to those helping support my Daughter's 529)
                             </p>
                            <button id="supportModalOk" style="
                                background: linear-gradient(135deg, #3b82f6, #1d4ed8);
                                color: white;
                                border: none;
                                padding: 12px 30px;
                                border-radius: 8px;
                                font-size: 16px;
                                font-weight: 600;
                                cursor: pointer;
                                transition: all 0.2s;
                                box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
                            " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 16px rgba(59, 130, 246, 0.4)'"
                               onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(59, 130, 246, 0.3)'">
                                OK
                            </button>
                        </div>
                    `;

          modal.appendChild(modalContent);
          document.body.appendChild(modal);

          // Handle OK button click
          document
            .getElementById("supportModalOk")
            .addEventListener("click", function () {
              document.body.removeChild(modal);
            });

          // Handle click outside modal
          modal.addEventListener("click", function (e) {
            if (e.target === modal) {
              document.body.removeChild(modal);
            }
          });

          // Handle ESC key
          const handleEscape = function (e) {
            if (e.key === "Escape") {
              document.body.removeChild(modal);
              document.removeEventListener("keydown", handleEscape);
            }
          };
          document.addEventListener("keydown", handleEscape);
        }
      });
    }

    // Update duration display - e.g., convert seconds to hours
    SettingsForms.updateDurationDisplay();

    // Set up timezone change functionality
    const timezoneSelect = container.querySelector("#timezone");
    if (timezoneSelect) {
      // Add timezone change event listener
      timezoneSelect.addEventListener("change", function () {
        console.log("[SettingsForms] Timezone changed to:", this.value);

        // Settings now use manual save - timezone change detected but not auto-saved
        console.log("[SettingsForms] Timezone changed - manual save required");
      });
    }

    // Set up manual save functionality for Settings
    this.setupSettingsManualSave(container, settings);
  },

  // Update duration display - e.g., convert seconds to hours
  updateDurationDisplay: function () {
    // Function to update a specific sleep duration display
    const updateSleepDisplay = function (inputId, spanId) {
      const input = document.getElementById(inputId);
      const span = document.getElementById(spanId);
      if (!input || !span) return;

      const seconds = parseInt(input.value);
      if (isNaN(seconds)) return;

      const hours = (seconds / 3600).toFixed(1);
      if (hours < 1) {
        const minutes = Math.round(seconds / 60);
        span.textContent = `${minutes} minutes`;
      } else {
        span.textContent = `${hours} hours`;
      }
    };

    // Update for each app
    updateSleepDisplay("sleep_duration", "sleep_duration_hours");
    updateSleepDisplay("radarr_sleep_duration", "radarr_sleep_duration_hours");
    updateSleepDisplay("lidarr_sleep_duration", "lidarr_sleep_duration_hours");
    updateSleepDisplay(
      "readarr_sleep_duration",
      "readarr_sleep_duration_hours"
    );
    updateSleepDisplay(
      "whisparr_sleep_duration",
      "whisparr_sleep_duration_hours"
    ); // Added Whisparr
  },

  // Setup instance management - test connection buttons and add/remove instance buttons
  setupInstanceManagement: function (container, appType, initialCount) {
    console.log(
      `Setting up instance management for ${appType} with ${initialCount} instances`
    );

    // Make sure container has the app type set
    const form = container.closest("#settingsSection");
    if (form && !form.hasAttribute("data-app-type")) {
      form.setAttribute("data-app-type", appType);
    }

    // Add auto-fetch listeners for URL and API key inputs (for all supported apps)
    const supportedApps = [
      "radarr",
      "sonarr",
      "lidarr",
      "readarr",
      "whisparr",
      "eros",
    ];
    if (supportedApps.includes(appType)) {
      const urlInputs = container.querySelectorAll('input[name="api_url"]');
      const apiKeyInputs = container.querySelectorAll('input[name="api_key"]');

      urlInputs.forEach((input) => {
        if (input.hasAttribute("data-instance-index")) {
          const instanceIndex = input.getAttribute("data-instance-index");
          input.addEventListener("input", () => {
            SettingsForms.checkConnectionStatus(appType, instanceIndex);
          });
          input.addEventListener("blur", () => {
            SettingsForms.checkConnectionStatus(appType, instanceIndex);
          });
        }
      });

      apiKeyInputs.forEach((input) => {
        if (input.hasAttribute("data-instance-index")) {
          const instanceIndex = input.getAttribute("data-instance-index");
          input.addEventListener("input", () => {
            SettingsForms.checkConnectionStatus(appType, instanceIndex);
          });
          input.addEventListener("blur", () => {
            SettingsForms.checkConnectionStatus(appType, instanceIndex);
          });
        }
      });

      // Initial check for existing data when form loads
      setTimeout(() => {
        urlInputs.forEach((input) => {
          if (input.hasAttribute("data-instance-index")) {
            const instanceIndex = input.getAttribute("data-instance-index");
            const apiKeyInput = container.querySelector(
              `#${appType}-key-${instanceIndex}`
            );

            // Only check if both URL and API key have meaningful values
            if (
              input.value.trim().length > 10 &&
              apiKeyInput &&
              apiKeyInput.value.trim().length > 20
            ) {
              console.log(
                `[Initial Check] Running connection check for ${appType} instance ${instanceIndex}`
              );
              SettingsForms.checkConnectionStatus(appType, instanceIndex);
            } else {
              console.log(
                `[Initial Check] Skipping connection check for ${appType} instance ${instanceIndex} - insufficient data`
              );
              // Set appropriate status message
              const statusElement = container.querySelector(
                `#${appType}-status-${instanceIndex}`
              );
              if (statusElement) {
                if (
                  input.value.trim().length <= 10 &&
                  (!apiKeyInput || apiKeyInput.value.trim().length <= 20)
                ) {
                  statusElement.textContent = "Enter URL and API Key";
                  statusElement.style.color = "#888";
                } else if (input.value.trim().length <= 10) {
                  statusElement.textContent = "Missing URL";
                  statusElement.style.color = "#fbbf24";
                } else if (
                  !apiKeyInput ||
                  apiKeyInput.value.trim().length <= 20
                ) {
                  statusElement.textContent = "Missing API Key";
                  statusElement.style.color = "#fbbf24";
                }
              }
            }
          }
        });
      }, 1000); // Increased timeout to 1000ms to ensure form is fully rendered
    }

    // Set up remove buttons for existing instances
    const removeButtons = container.querySelectorAll(".remove-instance-btn");
    removeButtons.forEach((btn) => {
      btn.addEventListener("click", function () {
        const instancePanel =
          btn.closest(".instance-item") || btn.closest(".instance-panel");
        if (instancePanel && instancePanel.parentNode) {
          instancePanel.parentNode.removeChild(instancePanel);

          // Update the button text with new count using the updateAddButtonText function
          const addBtn = container.querySelector(
            `.add-${appType}-instance-btn`
          );
          if (addBtn) {
            const instancesContainer = container.querySelector(
              ".instances-container"
            );
            if (instancesContainer) {
              const currentCount =
                instancesContainer.querySelectorAll(".instance-item").length;

              // Update button text based on app type
              const appNameCapitalized =
                appType.charAt(0).toUpperCase() + appType.slice(1);
              const displayName =
                appType === "eros"
                  ? "Whisparr V3"
                  : appType === "whisparr"
                  ? "Whisparr V2"
                  : appNameCapitalized;

              addBtn.innerHTML = `<i class="fas fa-plus"></i> Add ${displayName} Instance (${currentCount}/9)`;

              // Re-enable button if we're under the limit
              if (currentCount < 9) {
                addBtn.disabled = false;
                addBtn.title = "";
              }
            }
          }

          // Trigger change event to update save button state
          const changeEvent = new Event("change", { bubbles: true });
          container.dispatchEvent(changeEvent);
        }
      });
    });

    // Add instance button functionality
    const addBtn = container.querySelector(`.add-${appType}-instance-btn`);
    if (addBtn) {
      // Function to update the button text with current instance count
      const updateAddButtonText = (buttonRef = addBtn) => {
        const instancesContainer = container.querySelector(
          ".instances-container"
        );
        if (!instancesContainer) return;
        const currentCount =
          instancesContainer.querySelectorAll(".instance-item").length;

        // Update button text based on app type
        const appNameCapitalized =
          appType.charAt(0).toUpperCase() + appType.slice(1);
        const displayName =
          appType === "eros"
            ? "Whisparr V3"
            : appType === "whisparr"
            ? "Whisparr V2"
            : appNameCapitalized;

        buttonRef.innerHTML = `<i class="fas fa-plus"></i> Add ${displayName} Instance (${currentCount}/9)`;

        // Disable button if we've reached the limit
        if (currentCount >= 9) {
          buttonRef.disabled = true;
          buttonRef.title = "Maximum of 9 instances allowed";
        } else {
          buttonRef.disabled = false;
          buttonRef.title = "";
        }
      };

      // Remove any existing event listeners to prevent duplicates
      const newAddBtn = addBtn.cloneNode(true);
      addBtn.parentNode.replaceChild(newAddBtn, addBtn);

      // Initial button text update
      updateAddButtonText(newAddBtn);

      // Add event listener for the add button
      newAddBtn.addEventListener("click", function () {
        const instancesContainer = container.querySelector(
          ".instances-container"
        );
        if (!instancesContainer) return;

        const existingInstances =
          instancesContainer.querySelectorAll(".instance-item");
        const currentCount = existingInstances.length;

        // Don't allow more than 9 instances
        if (currentCount >= 9) {
          alert("Maximum of 9 instances allowed");
          return;
        }

        const newIndex = currentCount; // Use current count as new index

        // Get field names and defaults based on app type
        let missingFieldName,
          upgradeFieldName,
          missingDefault,
          upgradeDefault,
          missingLabel,
          upgradeLabel;

        switch (appType) {
          case "sonarr":
            missingFieldName = "hunt_missing_items";
            upgradeFieldName = "hunt_upgrade_items";
            missingDefault = 1;
            upgradeDefault = 0;
            missingLabel = "Missing Search";
            upgradeLabel = "Upgrade Search";
            break;
          case "radarr":
            missingFieldName = "hunt_missing_movies";
            upgradeFieldName = "hunt_upgrade_movies";
            missingDefault = 1;
            upgradeDefault = 0;
            missingLabel = "Missing Search";
            upgradeLabel = "Upgrade Search";
            break;
          case "lidarr":
            missingFieldName = "hunt_missing_items";
            upgradeFieldName = "hunt_upgrade_items";
            missingDefault = 1;
            upgradeDefault = 0;
            missingLabel = "Missing Search";
            upgradeLabel = "Upgrade Search";
            break;
          case "readarr":
            missingFieldName = "hunt_missing_books";
            upgradeFieldName = "hunt_upgrade_books";
            missingDefault = 1;
            upgradeDefault = 0;
            missingLabel = "Missing Search";
            upgradeLabel = "Upgrade Search";
            break;
          case "whisparr":
            missingFieldName = "hunt_missing_items";
            upgradeFieldName = "hunt_upgrade_items";
            missingDefault = 1;
            upgradeDefault = 0;
            missingLabel = "Missing Search";
            upgradeLabel = "Upgrade Search";
            break;
          case "eros":
            missingFieldName = "hunt_missing_items";
            upgradeFieldName = "hunt_upgrade_items";
            missingDefault = 1;
            upgradeDefault = 0;
            missingLabel = "Missing Search";
            upgradeLabel = "Upgrade Search";
            break;
          default:
            missingFieldName = "hunt_missing_items";
            upgradeFieldName = "hunt_upgrade_items";
            missingDefault = 1;
            upgradeDefault = 0;
            missingLabel = "Missing Search";
            upgradeLabel = "Upgrade Search";
        }

        // Create new instance HTML
        const newInstanceHtml = `
                    <div class="instance-item" data-instance-id="${newIndex}">
                        <div class="instance-header">
                            <h4>Instance ${newIndex + 1}: New Instance</h4>
                            <div class="instance-actions">
                                <button type="button" class="remove-instance-btn">Remove</button>
                                <span class="connection-status" id="${appType}-status-${newIndex}" style="margin-left: 10px; font-weight: bold; font-size: 0.9em;"></span>
                            </div>
                        </div>
                        <div class="instance-content">
                            <div class="setting-item">
                                <label for="${appType}-enabled-${newIndex}">Enabled:</label>
                                <label class="toggle-switch" style="width:40px; height:20px; display:inline-block; position:relative;">
                                    <input type="checkbox" id="${appType}-enabled-${newIndex}" name="enabled" checked>
                                    <span class="toggle-slider" style="position:absolute; cursor:pointer; top:0; left:0; right:0; bottom:0; background-color:#3d4353; border-radius:20px; transition:0.4s;"></span>
                                </label>
                                <p class="setting-help">Enable or disable this ${
                                  appType.charAt(0).toUpperCase() +
                                  appType.slice(1)
                                } instance for processing</p>
                            </div>
                            <div class="setting-item">
                                <label for="${appType}-name-${newIndex}">Name:</label>
                                <input type="text" id="${appType}-name-${newIndex}" name="name" value="" placeholder="Friendly name for this ${appType} instance">
                                <p class="setting-help">Friendly name for this ${appType} instance</p>
                            </div>
                            <div class="setting-item">
                                <label for="${appType}-url-${newIndex}">URL:</label>
                                <input type="text" id="${appType}-url-${newIndex}" name="api_url" value="" placeholder="Base URL for ${appType} (e.g., http://localhost:8989)" data-instance-index="${newIndex}">
                                <p class="setting-help">Base URL for ${appType}</p>
                            </div>
                            <div class="setting-item">
                                <label for="${appType}-key-${newIndex}">API Key:</label>
                                <input type="text" id="${appType}-key-${newIndex}" name="api_key" value="" placeholder="API key for ${appType}" data-instance-index="${newIndex}">
                                <p class="setting-help">API key for ${appType}</p>
                            </div>
                            <div class="setting-item">
                                <label for="${appType}-${missingFieldName}-${newIndex}">${missingLabel}:</label>
                                <input type="number" id="${appType}-${missingFieldName}-${newIndex}" name="${missingFieldName}" min="0" value="${missingDefault}" style="width: 80px;">
                                <p class="setting-help">Number of missing items to search per cycle (0 to disable)</p>
                            </div>
                            <div class="setting-item">
                                <label for="${appType}-${upgradeFieldName}-${newIndex}">${upgradeLabel}:</label>
                                <input type="number" id="${appType}-${upgradeFieldName}-${newIndex}" name="${upgradeFieldName}" min="0" value="${upgradeDefault}" style="width: 80px;">
                                <p class="setting-help">Number of items to search for quality upgrades per cycle (0 to disable)</p>
                            </div>
                            ${
                              appType === "sonarr"
                                ? `
                            <div class="setting-item">
                                <label for="${appType}-hunt-missing-mode-${newIndex}"><a href="https://plexguide.github.io/Huntarr.io/apps/sonarr.html#search-settings" class="info-icon" title="Learn more about missing search modes for this instance" target="_blank" rel="noopener"><i class="fas fa-info-circle"></i></a>Missing Search Mode:</label>
                                <select id="${appType}-hunt-missing-mode-${newIndex}" name="hunt_missing_mode">
                                    <option value="seasons_packs" selected>Season Packs</option>
                                    <option value="shows">Shows</option>
                                    <option value="episodes">Episodes</option>
                                </select>
                                <p class="setting-help">How to search for missing content for this instance (Season Packs recommended)</p>
                                <p class="setting-help" style="display: none;" id="episodes-missing-warning-${newIndex}">⚠️ Episodes mode makes more API calls and does not support tagging. Season Packs recommended.</p>
                            </div>
                            <div class="setting-item">
                                <label for="${appType}-upgrade-mode-${newIndex}"><a href="https://plexguide.github.io/Huntarr.io/apps/sonarr.html#search-settings" class="info-icon" title="Learn more about upgrade modes for this instance" target="_blank" rel="noopener"><i class="fas fa-info-circle"></i></a>Upgrade Mode:</label>
                                <select id="${appType}-upgrade-mode-${newIndex}" name="upgrade_mode">
                                    <option value="seasons_packs" selected>Season Packs</option>
                                    <option value="shows">Shows</option>
                                    <option value="episodes">Episodes</option>
                                </select>
                                <p class="setting-help">How to search for upgrades for this instance (Season Packs recommended)</p>
                                <p class="setting-help" style="display: none;" id="episodes-upgrade-warning-${newIndex}">⚠️ Episodes mode makes more API calls and does not support tagging. Season Packs recommended.</p>
                            </div>
                            `
                                : ""
                            }
                            <!-- Instance State Management -->
                            <div class="setting-item" style="border-top: 1px solid rgba(90, 109, 137, 0.2); padding-top: 15px; margin-top: 15px;">
                                <label for="${appType}-state-management-mode-${newIndex}"><a href="https://plexguide.github.io/Huntarr.io/settings/settings.html#state-reset-hours" class="info-icon" title="Configure state management for this instance" target="_blank" rel="noopener"><i class="fas fa-database"></i></a>State Management:</label>
                                <div style="display: flex; align-items: center; gap: 10px;">
                                    <select id="${appType}-state-management-mode-${newIndex}" name="state_management_mode" style="width: 150px; padding: 8px 12px; border-radius: 6px; cursor: pointer; border: 1px solid rgba(255, 255, 255, 0.1); background-color: #1f2937; color: #d1d5db;">
                                        <option value="custom" selected>Enabled</option>
                                        <option value="disabled">Disabled</option>
                                    </select>
                                    <button type="button" id="${appType}-state-reset-btn-${newIndex}" class="btn btn-danger" style="display: inline-flex; background: linear-gradient(145deg, rgba(231, 76, 60, 0.2), rgba(192, 57, 43, 0.15)); color: rgba(231, 76, 60, 0.9); border: 1px solid rgba(231, 76, 60, 0.3); padding: 6px 12px; border-radius: 6px; font-size: 12px; align-items: center; gap: 4px; cursor: pointer; transition: all 0.2s ease;">
                                        <i class="fas fa-redo"></i> Reset State
                                    </button>
                                </div>
                                <p class="setting-help">Enable state management to track processed media and prevent reprocessing</p>
                            </div>
                            
                            <!-- State Management Hours (visible when enabled) -->
                            <div class="setting-item" id="${appType}-custom-state-hours-${newIndex}" style="display: block; margin-left: 20px; padding: 12px; background: linear-gradient(145deg, rgba(30, 39, 56, 0.3), rgba(22, 28, 40, 0.4)); border: 1px solid rgba(90, 109, 137, 0.15); border-radius: 8px;">
                                <label for="${appType}-state-management-hours-${newIndex}" style="display: flex; align-items: center; gap: 8px;">
                                    <i class="fas fa-clock" style="color: #6366f1;"></i>
                                    Reset Interval:
                                </label>
                                <div style="display: flex; align-items: center; gap: 10px; margin-top: 8px;">
                                    <input type="number" id="${appType}-state-management-hours-${newIndex}" name="state_management_hours" min="1" max="8760" value="168" style="width: 80px; padding: 8px 12px; border-radius: 4px; border: 1px solid rgba(255, 255, 255, 0.1); background-color: #374151; color: #d1d5db;">
                                    <span style="color: #9ca3af; font-size: 14px;">
                                        hours (<span id="${appType}-state-days-display-${newIndex}">7.0</span> days)
                                    </span>
                                </div>
                                <p class="setting-help" style="font-size: 13px; color: #9ca3af; margin-top: 8px;">
                                    <i class="fas fa-info-circle" style="margin-right: 4px;"></i>
                                    State will automatically reset every <span id="${appType}-state-hours-text-${newIndex}">168</span> hours
                                </p>
                            </div>
                            
                            <!-- State Status Display -->
                            <div class="setting-item" id="${appType}-state-status-${newIndex}" style="display: block; margin-left: 20px; padding: 10px; background: linear-gradient(145deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.05)); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 6px;">
                                <div style="display: flex; justify-content: space-between; align-items: center; font-size: 13px;">
                                    <div style="display: flex; align-items: center; gap: 8px;">
                                        <span style="color: #10b981; font-weight: 600;">
                                            <i class="fas fa-check-circle" style="margin-right: 4px;"></i>
                                            Active - Tracked Items: <span id="${appType}-state-items-count-${newIndex}">0</span>
                                        </span>
                                    </div>
                                    <div style="text-align: right;">
                                        <div style="color: #9ca3af; font-size: 12px;">Next Reset:</div>
                                        <div id="${appType}-state-reset-time-${newIndex}" style="color: #d1d5db; font-weight: 500;">Calculating...</div>
                                    </div>
                                </div>
                            </div>

                            <div class="setting-item">
                                <label for="${appType}-swaparr-${newIndex}"><a href="https://plexguide.github.io/Huntarr.io/apps/swaparr.html" class="info-icon" title="Enable Swaparr stalled download monitoring for this instance" target="_blank" rel="noopener"><i class="fas fa-info-circle"></i></a>Swaparr:</label>
                                <label class="toggle-switch" style="width:40px; height:20px; display:inline-block; position:relative;">
                                    <input type="checkbox" id="${appType}-swaparr-${newIndex}" name="swaparr_enabled">
                                    <span class="toggle-slider" style="position:absolute; cursor:pointer; top:0; left:0; right:0; bottom:0; background-color:#3d4353; border-radius:20px; transition:0.4s;"></span>
                                </label>
                                <p class="setting-help">Enable Swaparr to monitor and remove stalled downloads for this ${
                                  appType.charAt(0).toUpperCase() +
                                  appType.slice(1)
                                } instance</p>
                            </div>
                        </div>
                    </div>
                `;

        // Add the new instance to the container
        instancesContainer.insertAdjacentHTML("beforeend", newInstanceHtml);

        // Get the newly added instance element
        const newInstance = instancesContainer.querySelector(
          `[data-instance-id="${newIndex}"]`
        );

        // Set up event listeners for the new instance's buttons
        const newRemoveBtn = newInstance.querySelector(".remove-instance-btn");

        // Remove button
        if (newRemoveBtn) {
          newRemoveBtn.addEventListener("click", function () {
            newInstance.remove();
            updateAddButtonText(newAddBtn);

            // Trigger change event
            const changeEvent = new Event("change", { bubbles: true });
            container.dispatchEvent(changeEvent);
          });
        }

        // Set up auto-detection for the new instance
        const newUrlInput = newInstance.querySelector(
          `#${appType}-url-${newIndex}`
        );
        const newApiKeyInput = newInstance.querySelector(
          `#${appType}-key-${newIndex}`
        );

        if (newUrlInput) {
          newUrlInput.addEventListener("input", function () {
            setTimeout(() => {
              SettingsForms.checkConnectionStatus(appType, newIndex);
            }, 1000); // 1 second delay to prevent spam while typing
          });
        }

        if (newApiKeyInput) {
          newApiKeyInput.addEventListener("input", function () {
            setTimeout(() => {
              SettingsForms.checkConnectionStatus(appType, newIndex);
            }, 1000); // 1 second delay to prevent spam while typing
          });
        }

        // Set up mode dropdown event listeners for Sonarr instances
        if (appType === "sonarr") {
          const huntMissingModeSelect = newInstance.querySelector(
            `#${appType}-hunt-missing-mode-${newIndex}`
          );
          const upgradeModeSelect = newInstance.querySelector(
            `#${appType}-upgrade-mode-${newIndex}`
          );
          const episodesMissingWarning = newInstance.querySelector(
            `#episodes-missing-warning-${newIndex}`
          );
          const episodesUpgradeWarning = newInstance.querySelector(
            `#episodes-upgrade-warning-${newIndex}`
          );

          if (huntMissingModeSelect && episodesMissingWarning) {
            huntMissingModeSelect.addEventListener("change", function () {
              if (this.value === "episodes") {
                episodesMissingWarning.style.display = "block";
              } else {
                episodesMissingWarning.style.display = "none";
              }
              // Update air date delay visibility
              updateAirDateDelayVisibility();
            });
          }

          if (upgradeModeSelect && episodesUpgradeWarning) {
            upgradeModeSelect.addEventListener("change", function () {
              if (this.value === "episodes") {
                episodesUpgradeWarning.style.display = "block";
              } else {
                episodesUpgradeWarning.style.display = "none";
              }
              // Update air date delay visibility
              updateAirDateDelayVisibility();
            });
          }

          // Function to update air date delay visibility based on selected modes
          function updateAirDateDelayVisibility() {
            const airDateDelayContainer = document.getElementById(
              `sonarr-air-date-delay-container-${instanceIndex}`
            );
            if (airDateDelayContainer) {
              const missingMode = huntMissingModeSelect
                ? huntMissingModeSelect.value
                : "seasons_packs";
              const upgradeMode = upgradeModeSelect
                ? upgradeModeSelect.value
                : "seasons_packs";

              // Show if either missing or upgrade mode is episodes (not shows)
              const shouldShow =
                missingMode === "episodes" ||
                upgradeMode === "episodes";

              airDateDelayContainer.style.display = shouldShow
                ? "block"
                : "none";
            }
          }
        }

        // Set up state management event listeners for the new instance
        const stateManagementModeSelect = newInstance.querySelector(
          `#${appType}-state-management-mode-${newIndex}`
        );
        const customStateHours = newInstance.querySelector(
          `#${appType}-custom-state-hours-${newIndex}`
        );
        const stateStatus = newInstance.querySelector(
          `#${appType}-state-status-${newIndex}`
        );
        const stateResetBtn = newInstance.querySelector(
          `#${appType}-state-reset-btn-${newIndex}`
        );
        const stateHoursInput = newInstance.querySelector(
          `#${appType}-state-management-hours-${newIndex}`
        );
        const stateDaysDisplay = newInstance.querySelector(
          `#${appType}-state-days-display-${newIndex}`
        );
        const stateHoursText = newInstance.querySelector(
          `#${appType}-state-hours-text-${newIndex}`
        );

        if (
          stateManagementModeSelect &&
          customStateHours &&
          stateStatus &&
          stateResetBtn
        ) {
          // State management mode change listener
          stateManagementModeSelect.addEventListener("change", function () {
            if (this.value === "disabled") {
              customStateHours.style.display = "none";
              stateStatus.style.display = "none";
              stateResetBtn.style.display = "none";
            } else {
              customStateHours.style.display = "block";
              stateStatus.style.display = "block";
              stateResetBtn.style.display = "inline-flex";
            }
          });

          // State reset button listener
          stateResetBtn.addEventListener("click", function () {
            const instanceNameInput =
              newInstance.querySelector('input[name="name"]');
            const instanceName = instanceNameInput
              ? instanceNameInput.value || "Default"
              : "Default";

            if (
              confirm(
                `Are you sure you want to reset the state for ${
                  appType.charAt(0).toUpperCase() + appType.slice(1)
                } instance "${instanceName}"? This will clear all tracking data and allow items to be reprocessed.`
              )
            ) {
              // Call the state reset API
              const resetUrl = `./api/stateful/reset?app_type=${encodeURIComponent(
                appType
              )}&instance_name=${encodeURIComponent(instanceName)}`;

              fetch(resetUrl, { method: "POST" })
                .then((response) => response.json())
                .then((data) => {
                  if (data.success) {
                    // Reload state information for this instance
                    if (
                      typeof huntarrUI !== "undefined" &&
                      huntarrUI.loadStateManagementForInstance
                    ) {
                      huntarrUI.loadStateManagementForInstance(
                        appType,
                        newIndex,
                        instanceName
                      );
                    }
                    alert("State reset successfully!");
                  } else {
                    alert(
                      "Failed to reset state: " +
                        (data.message || "Unknown error")
                    );
                  }
                })
                .catch((error) => {
                  console.error("Error resetting state:", error);
                  alert("Error resetting state. Please try again.");
                });
            }
          });
        }

        // State hours input listener for real-time updates
        if (stateHoursInput && stateDaysDisplay && stateHoursText) {
          stateHoursInput.addEventListener("input", function () {
            const hours = parseInt(this.value) || 168;
            const days = (hours / 24).toFixed(1);
            stateDaysDisplay.textContent = days;
            stateHoursText.textContent = hours;
          });
        }

        // Load state information for the new instance after a short delay
        setTimeout(() => {
          if (
            typeof huntarrUI !== "undefined" &&
            huntarrUI.loadStateManagementForInstance
          ) {
            const instanceNameInput =
              newInstance.querySelector('input[name="name"]');
            const instanceName = instanceNameInput
              ? instanceNameInput.value || "Default"
              : "Default";
            huntarrUI.loadStateManagementForInstance(
              appType,
              newIndex,
              instanceName
            );
          }
        }, 1000);

        // Initial status check for the new instance
        SettingsForms.checkConnectionStatus(appType, newIndex);

        // Update button text and trigger change event
        updateAddButtonText(newAddBtn);
        const changeEvent = new Event("change", { bubbles: true });
        container.dispatchEvent(changeEvent);

        // Update Swaparr visibility for the new instance

        // Focus on the name input of the new instance
        const nameInput = newInstance.querySelector('input[name="name"]');
        if (nameInput) {
          nameInput.focus();
        }
      });
    }
  },

  // Test connection to an *arr API
  testConnection: function (app, url, apiKey, buttonElement) {
    // Temporarily suppress change detection to prevent the unsaved changes dialog
    if (window.huntarrUI) {
      window.huntarrUI.suppressUnsavedChangesCheck = true;
    }

    // Also set a global flag used by the apps module
    window._suppressUnsavedChangesDialog = true;

    // Find or create a status message element next to the button
    let statusElement = buttonElement
      .closest(".instance-actions")
      .querySelector(".connection-message");
    if (!statusElement) {
      statusElement = document.createElement("span");
      statusElement.className = "connection-message";
      statusElement.style.marginLeft = "10px";
      statusElement.style.fontWeight = "bold";
      buttonElement
        .closest(".instance-actions")
        .insertBefore(statusElement, buttonElement);
    }

    // Show testing status
    const originalButtonHTML = buttonElement.innerHTML;
    buttonElement.innerHTML =
      '<i class="fas fa-spinner fa-spin"></i> Testing...';
    buttonElement.disabled = true;
    statusElement.textContent = "Testing connection...";
    statusElement.style.color = "#888";

    console.log(
      `Testing connection for ${app} - URL: ${url}, API Key: ${apiKey.substring(
        0,
        5
      )}...`
    );

    if (!url) {
      statusElement.textContent = "Please enter a valid URL";
      statusElement.style.color = "red";
      buttonElement.innerHTML = originalButtonHTML;
      buttonElement.disabled = false;
      // Reset suppression flags
      this._resetSuppressionFlags();
      return;
    }

    if (!apiKey) {
      statusElement.textContent = "Please enter a valid API key";
      statusElement.style.color = "red";
      buttonElement.innerHTML = originalButtonHTML;
      buttonElement.disabled = false;
      // Reset suppression flags
      this._resetSuppressionFlags();
      return;
    }

    // Make the API request
    HuntarrUtils.fetchWithTimeout(`./api/${app}/test-connection`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_url: url,
        api_key: apiKey,
      }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(
            `HTTP error ${response.status}: ${response.statusText}`
          );
        }
        return response.json();
      })
      .then((data) => {
        console.log(`Test connection response:`, data);

        // Reset button
        buttonElement.disabled = false;

        if (data.success) {
          // Success
          buttonElement.innerHTML =
            '<i class="fas fa-plug"></i> Test Connection';

          let successMessage = `Connected successfully`;
          if (data.version) {
            successMessage += ` (v${data.version})`;
          }

          // Show success message
          statusElement.textContent = successMessage;
          statusElement.style.color = "green";

          // Connection successful - no additional actions needed
        } else {
          // Failure
          buttonElement.innerHTML =
            '<i class="fas fa-plug"></i> Test Connection';

          // Show error message
          const errorMsg = data.message || "Connection failed";
          statusElement.textContent = errorMsg;
          statusElement.style.color = "red";
        }

        // Reset suppression flags after a short delay to handle any potential redirects
        setTimeout(() => {
          this._resetSuppressionFlags();
        }, 500);
      })
      .catch((error) => {
        console.error(`Connection test error:`, error);

        // Reset button
        buttonElement.innerHTML = originalButtonHTML;
        buttonElement.disabled = false;

        // Show error message
        statusElement.textContent = `Error: ${error.message}`;
        statusElement.style.color = "red";

        // Reset suppression flags
        this._resetSuppressionFlags();
      });
  },

  // Helper method to reset unsaved changes suppression flags
  _resetSuppressionFlags: function () {
    console.log("[ConnectionStatus] Resetting all suppression flags");
    // Reset all suppression flags
    if (window.huntarrUI) {
      window.huntarrUI.suppressUnsavedChangesCheck = false;
    }
    window._suppressUnsavedChangesDialog = false;
    window._appsSuppressChangeDetection = false;
    console.log("[ConnectionStatus] All suppression flags reset");
  },

  // Check connection status for an instance
  checkConnectionStatus: function (app, instanceIndex) {
    const supportedApps = [
      "radarr",
      "sonarr",
      "lidarr",
      "readarr",
      "whisparr",
      "eros",
      "prowlarr",
    ];
    if (!supportedApps.includes(app)) return;

    const urlInput = document.getElementById(`${app}-url-${instanceIndex}`);
    const apiKeyInput = document.getElementById(`${app}-key-${instanceIndex}`);

    if (!urlInput || !apiKeyInput) return;

    const url = urlInput.value.trim();
    const apiKey = apiKeyInput.value.trim();

    // Find the status element in the instance header
    const statusElement = document.getElementById(
      `${app}-status-${instanceIndex}`
    );

    console.log(
      `[ConnectionStatus] Suppressing change detection for ${app} instance ${instanceIndex}`
    );

    // Temporarily suppress change detection to prevent the unsaved changes dialog
    if (window.huntarrUI) {
      window.huntarrUI.suppressUnsavedChangesCheck = true;
    }
    window._suppressUnsavedChangesDialog = true;
    window._appsSuppressChangeDetection = true;

    // Show appropriate status for incomplete fields
    if (url.length <= 10 && apiKey.length <= 20) {
      if (statusElement) {
        statusElement.textContent = "Enter URL and API Key";
        statusElement.style.color = "#888";
      }
      // Longer delay for reset to ensure all changes are processed
      setTimeout(() => {
        this._resetSuppressionFlags();
      }, 2000);
      return;
    } else if (url.length <= 10) {
      if (statusElement) {
        statusElement.textContent = "Missing URL";
        statusElement.style.color = "#fbbf24";
      }
      setTimeout(() => {
        this._resetSuppressionFlags();
      }, 2000);
      return;
    } else if (apiKey.length <= 20) {
      if (statusElement) {
        statusElement.textContent = "Missing API Key";
        statusElement.style.color = "#fbbf24";
      }
      setTimeout(() => {
        this._resetSuppressionFlags();
      }, 2000);
      return;
    }

    // Show checking status
    if (statusElement) {
      statusElement.textContent = "Checking...";
      statusElement.style.color = "#888";
    }

    console.log(
      `Checking connection status for ${app} instance ${instanceIndex}`
    );

    // Delay to avoid spamming API calls while typing
    const timeoutKey = `${app}_${instanceIndex}`;
    if (this._autoFetchTimeouts && this._autoFetchTimeouts[timeoutKey]) {
      clearTimeout(this._autoFetchTimeouts[timeoutKey]);
    }
    if (!this._autoFetchTimeouts) {
      this._autoFetchTimeouts = {};
    }
    this._autoFetchTimeouts[timeoutKey] = setTimeout(() => {
      this.testConnectionAndUpdateStatus(
        app,
        instanceIndex,
        url,
        apiKey,
        statusElement
      );
    }, 1000); // Wait 1 second after user stops typing
  },

  // Test connection and update status
  testConnectionAndUpdateStatus: function (
    app,
    instanceIndex,
    url,
    apiKey,
    statusElement
  ) {
    console.log(
      `[ConnectionStatus] Testing connection for ${app} instance ${instanceIndex}`
    );

    // Add a backup timeout in case the request hangs
    const backupTimeoutId = setTimeout(() => {
      console.error(
        `[ConnectionStatus] Backup timeout triggered for ${app} instance ${instanceIndex}`
      );
      if (statusElement) {
        statusElement.textContent = "✗ Connection timeout";
        statusElement.style.color = "#ef4444";
      }
      this._resetSuppressionFlags();
    }, 30000); // 30 second backup timeout

    // Make API request to test connection
    HuntarrUtils.fetchWithTimeout(`./api/${app}/test-connection`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_url: url,
        api_key: apiKey,
      }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(
            `HTTP error ${response.status}: ${response.statusText}`
          );
        }
        return response.json();
      })
      .then((data) => {
        clearTimeout(backupTimeoutId); // Clear the backup timeout since we got a response
        console.log(
          `[ConnectionStatus] Connection test response for ${app} instance ${instanceIndex}:`,
          data
        );

        if (data.success) {
          // Update status to connected
          if (statusElement) {
            let statusText = "✓ Connected";
            if (data.version) {
              statusText += ` (v${data.version})`;
            }
            statusElement.textContent = statusText;
            statusElement.style.color = "#10b981";
          }
        } else {
          // Update status to connection failed
          if (statusElement) {
            statusElement.textContent = "✗ Connection failed";
            statusElement.style.color = "#ef4444";
          }
        }

        // Reset suppression flags after updating status with longer delay
        console.log(
          `[ConnectionStatus] Resetting suppression flags for ${app} instance ${instanceIndex} in 2 seconds`
        );
        setTimeout(() => {
          console.log(
            `[ConnectionStatus] Suppression flags reset for ${app} instance ${instanceIndex}`
          );
          this._resetSuppressionFlags();
        }, 2000);
      })
      .catch((error) => {
        clearTimeout(backupTimeoutId); // Clear the backup timeout since we got an error response
        console.error(
          `[ConnectionStatus] Connection test error for ${app} instance ${instanceIndex}:`,
          error
        );

        // Update status to error
        if (statusElement) {
          statusElement.textContent = "✗ Connection error";
          statusElement.style.color = "#ef4444";
        }

        // Reset suppression flags after updating status with longer delay
        console.log(
          `[ConnectionStatus] Resetting suppression flags for ${app} instance ${instanceIndex} in 2 seconds (error case)`
        );
        setTimeout(() => {
          console.log(
            `[ConnectionStatus] Suppression flags reset for ${app} instance ${instanceIndex} (error case)`
          );
          this._resetSuppressionFlags();
        }, 2000);
      });
  },

  // Update visibility of Swaparr fields in all app forms based on global Swaparr setting
  updateSwaparrFieldsDisabledState: function () {
    // First ensure we have the current Swaparr state
    this.fetchAndCacheSwaparrState().then(() => {
      const isEnabled = this.isSwaparrGloballyEnabled();
      console.log(
        `[SettingsForms] Updating Swaparr fields visibility with state: ${isEnabled}`
      );

      // Since Swaparr sections are now conditionally rendered, we need to regenerate forms
      // to show/hide the Swaparr sections. Check if any app forms are currently visible.
      const appTypes = [
        "sonarr",
        "radarr",
        "lidarr",
        "readarr",
        "whisparr",
        "eros",
      ];
      let formsRegenerated = false;

      appTypes.forEach((appType) => {
        const container = document.querySelector(
          `[data-app-type="${appType}"]`
        );
        if (container && container.innerHTML.trim() !== "") {
          // This app form is currently loaded, regenerate it to update Swaparr visibility
          try {
            // Get current settings from cache or original settings
            let settings = {};
            if (window.huntarrUI?.originalSettings?.[appType]) {
              settings = window.huntarrUI.originalSettings[appType];
            }

            // Regenerate the form
            const formMethodName = `generate${
              appType.charAt(0).toUpperCase() + appType.slice(1)
            }Form`;
            if (this[formMethodName]) {
              this[formMethodName](container, settings);
              formsRegenerated = true;
            }
          } catch (e) {
            console.warn(
              `[SettingsForms] Failed to regenerate ${appType} form:`,
              e
            );
          }
        }
      });

      if (formsRegenerated) {
        console.log(
          `[SettingsForms] Regenerated app forms to update Swaparr visibility: ${
            isEnabled ? "enabled" : "disabled"
          }`
        );
      } else {
        console.log(
          `[SettingsForms] Updated Swaparr field visibility state: ${
            isEnabled ? "enabled" : "disabled"
          }`
        );
      }
    });
  },

  // Update Swaparr instance visibility for all loaded app forms
  updateAllSwaparrInstanceVisibility: function () {
    console.log("[SettingsForms] Updating Swaparr instance visibility...");
    this.updateSwaparrFieldsDisabledState();
  },

  // Fetch and cache current Swaparr state from server
  fetchAndCacheSwaparrState: function () {
    return fetch("./api/settings/swaparr")
      .then((response) => response.json())
      .then((data) => {
        console.log("[SettingsForms] Fetched current Swaparr state:", data);

        // Update cache
        try {
          let cachedSettings = {};
          const existing = localStorage.getItem("huntarr-settings-cache");
          if (existing) {
            cachedSettings = JSON.parse(existing);
          }
          if (!cachedSettings.swaparr) cachedSettings.swaparr = {};
          cachedSettings.swaparr.enabled = data.enabled === true;
          localStorage.setItem(
            "huntarr-settings-cache",
            JSON.stringify(cachedSettings)
          );
          console.log(
            "[SettingsForms] Updated Swaparr cache:",
            cachedSettings.swaparr
          );
        } catch (e) {
          console.warn("[SettingsForms] Failed to update Swaparr cache:", e);
        }

        // Update window settings if available
        if (window.huntarrUI && window.huntarrUI.originalSettings) {
          if (!window.huntarrUI.originalSettings.swaparr) {
            window.huntarrUI.originalSettings.swaparr = {};
          }
          window.huntarrUI.originalSettings.swaparr.enabled =
            data.enabled === true;
        }

        return data.enabled === true;
      })
      .catch((error) => {
        console.warn("[SettingsForms] Failed to fetch Swaparr state:", error);
        return false;
      });
  },

  // Generate Notifications settings form
  generateNotificationsForm: function (container, settings = {}) {
    // Add data-app-type attribute to container
    container.setAttribute("data-app-type", "notifications");

    container.innerHTML = `
            <div class="settings-group" style="
                background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%);
                border: 2px solid rgba(90, 109, 137, 0.3);
                border-radius: 12px;
                padding: 20px;
                margin: 15px 0 25px 0;
                box-shadow: 0 4px 12px rgba(90, 109, 137, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1);
            ">
                <h3>Apprise Notifications</h3>
                <div class="setting-item">
                    <label for="enable_notifications"><a href="https://plexguide.github.io/Huntarr.io/settings/settings.html#enable-notifications" class="info-icon" title="Enable or disable notifications" target="_blank" rel="noopener"><i class="fas fa-info-circle"></i></a>Enable Notifications:</label>
                    <label class="toggle-switch" style="width:40px; height:20px; display:inline-block; position:relative;">
                        <input type="checkbox" id="enable_notifications" ${
                          settings.enable_notifications === true
                            ? "checked"
                            : ""
                        }>
                        <span class="toggle-slider" style="position:absolute; cursor:pointer; top:0; left:0; right:0; bottom:0; background-color:#3d4353; border-radius:20px; transition:0.4s;"></span>
                    </label>
                    <p class="setting-help" style="margin-left: -3ch !important;">Enable sending notifications via Apprise for media processing events</p>
                </div>
                <div class="setting-item">
                    <label for="notification_level"><a href="https://plexguide.github.io/Huntarr.io/settings/settings.html#notification-level" class="info-icon" title="Set minimum notification level" target="_blank" rel="noopener"><i class="fas fa-info-circle"></i></a>Notification Level:</label>
                    <select id="notification_level" name="notification_level" style="width: 200px; padding: 8px 12px; border-radius: 6px; cursor: pointer; border: 1px solid rgba(255, 255, 255, 0.1); background-color: #1f2937; color: #d1d5db;">
                        <option value="info" ${
                          settings.notification_level === "info" ||
                          !settings.notification_level
                            ? "selected"
                            : ""
                        }>Info</option>
                        <option value="success" ${
                          settings.notification_level === "success"
                            ? "selected"
                            : ""
                        }>Success</option>
                        <option value="warning" ${
                          settings.notification_level === "warning"
                            ? "selected"
                            : ""
                        }>Warning</option>
                        <option value="error" ${
                          settings.notification_level === "error"
                            ? "selected"
                            : ""
                        }>Error</option>
                    </select>
                    <p class="setting-help" style="margin-left: -3ch !important;">Minimum level of events that will trigger notifications</p>
                </div>
                <div class="setting-item">
                    <label for="apprise_urls"><a href="https://plexguide.github.io/Huntarr.io/settings/settings.html#apprise-urls" class="info-icon" title="Learn about Apprise URL formats" target="_blank" rel="noopener"><i class="fas fa-info-circle"></i></a>Apprise URLs:</label>
                    <textarea id="apprise_urls" rows="4" style="width: 100%; padding: 8px 12px; border-radius: 6px; border: 1px solid rgba(255, 255, 255, 0.1); background-color: #1f2937; color: #d1d5db;">${(
                      settings.apprise_urls || []
                    ).join("\n")}</textarea>
                    <p class="setting-help" style="margin-left: -3ch !important;">Enter one Apprise URL per line (e.g., discord://, telegram://, etc)</p>
                    <p class="setting-help"><a href="https://plexguide.github.io/Huntarr.io/settings/settings.html#apprise-urls" target="_blank">Click here for detailed Apprise URL documentation</a></p>
                    <div style="margin-top: 10px;">
                        <button type="button" id="testNotificationBtn" class="btn btn-secondary" style="background-color: #6366f1; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 14px;">
                            <i class="fas fa-bell"></i> Test Notification
                        </button>
                        <span id="testNotificationStatus" style="margin-left: 10px; font-size: 14px;"></span>
                    </div>
                    <p class="setting-help" style="margin-left: -3ch !important; margin-top: 8px; font-style: italic; color: #9ca3af;">
                        <i class="fas fa-magic" style="margin-right: 4px;"></i>Testing will automatically save your current settings first
                    </p>
                </div>
                <div class="setting-item">
                    <label for="notify_on_missing"><a href="https://plexguide.github.io/Huntarr.io/settings/settings.html#notify-on-missing" class="info-icon" title="Send notifications for missing media" target="_blank" rel="noopener"><i class="fas fa-info-circle"></i></a>Notify on Missing:</label>
                    <label class="toggle-switch" style="width:40px; height:20px; display:inline-block; position:relative;">
                        <input type="checkbox" id="notify_on_missing" ${
                          settings.notify_on_missing !== false ? "checked" : ""
                        }>
                        <span class="toggle-slider" style="position:absolute; cursor:pointer; top:0; left:0; right:0; bottom:0; background-color:#3d4353; border-radius:20px; transition:0.4s;"></span>
                    </label>
                    <p class="setting-help" style="margin-left: -3ch !important;">Send notifications when missing media is processed</p>
                </div>
                <div class="setting-item">
                    <label for="notify_on_upgrade"><a href="https://plexguide.github.io/Huntarr.io/settings/settings.html#notify-on-upgrade" class="info-icon" title="Learn more about upgrade notifications" target="_blank" rel="noopener"><i class="fas fa-info-circle"></i></a>Notify on Upgrade:</label>
                    <label class="toggle-switch" style="width:40px; height:20px; display:inline-block; position:relative;">
                        <input type="checkbox" id="notify_on_upgrade" ${
                          settings.notify_on_upgrade !== false ? "checked" : ""
                        }>
                        <span class="toggle-slider" style="position:absolute; cursor:pointer; top:0; left:0; right:0; bottom:0; background-color:#3d4353; border-radius:20px; transition:0.4s;"></span>
                    </label>
                    <p class="setting-help" style="margin-left: -3ch !important;">Send notifications when media is upgraded</p>
                </div>
                <div class="setting-item">
                    <label for="notification_include_instance"><a href="https://plexguide.github.io/Huntarr.io/settings/settings.html#include-instance" class="info-icon" title="Include instance name in notifications" target="_blank" rel="noopener"><i class="fas fa-info-circle"></i></a>Include Instance:</label>
                    <label class="toggle-switch" style="width:40px; height:20px; display:inline-block; position:relative;">
                        <input type="checkbox" id="notification_include_instance" ${
                          settings.notification_include_instance !== false
                            ? "checked"
                            : ""
                        }>
                        <span class="toggle-slider" style="position:absolute; cursor:pointer; top:0; left:0; right:0; bottom:0; background-color:#3d4353; border-radius:20px; transition:0.4s;"></span>
                    </label>
                    <p class="setting-help" style="margin-left: -3ch !important;">Include instance name in notification messages</p>
                </div>
                <div class="setting-item">
                    <label for="notification_include_app"><a href="https://plexguide.github.io/Huntarr.io/settings/settings.html#include-app-name" class="info-icon" title="Include app name in notifications" target="_blank" rel="noopener"><i class="fas fa-info-circle"></i></a>Include App Name:</label>
                    <label class="toggle-switch" style="width:40px; height:20px; display:inline-block; position:relative;">
                        <input type="checkbox" id="notification_include_app" ${
                          settings.notification_include_app !== false
                            ? "checked"
                            : ""
                        }>
                        <span class="toggle-slider" style="position:absolute; cursor:pointer; top:0; left:0; right:0; bottom:0; background-color:#3d4353; border-radius:20px; transition:0.4s;"></span>
                    </label>
                    <p class="setting-help" style="margin-left: -3ch !important;">Include app name (Sonarr, Radarr, etc.) in notification messages</p>
                </div>
            </div>
        `;

    // Set up Apprise notifications toggle functionality
    const enableNotificationsCheckbox = container.querySelector(
      "#enable_notifications"
    );
    if (enableNotificationsCheckbox) {
      // Function to toggle notification settings visibility
      const toggleNotificationSettings = function (enabled) {
        const settingsToToggle = [
          "notification_level",
          "apprise_urls",
          "testNotificationBtn",
          "notify_on_missing",
          "notify_on_upgrade",
          "notification_include_instance",
          "notification_include_app",
        ];

        // Find parent setting-item containers for each setting
        settingsToToggle.forEach((settingId) => {
          const element = container.querySelector(`#${settingId}`);
          if (element) {
            // Find the parent setting-item div
            const settingItem = element.closest(".setting-item");
            if (settingItem) {
              if (enabled) {
                settingItem.style.opacity = "1";
                settingItem.style.pointerEvents = "";
                // Re-enable form elements
                const inputs = settingItem.querySelectorAll(
                  "input, select, textarea, button"
                );
                inputs.forEach((input) => {
                  input.disabled = false;
                  input.style.cursor = "";
                });
              } else {
                settingItem.style.opacity = "0.4";
                settingItem.style.pointerEvents = "none";
                // Disable form elements
                const inputs = settingItem.querySelectorAll(
                  "input, select, textarea, button"
                );
                inputs.forEach((input) => {
                  input.disabled = true;
                  input.style.cursor = "not-allowed";
                });
              }
            }
          }
        });

        // Special handling for test notification button and its container
        const testBtn = container.querySelector("#testNotificationBtn");
        if (testBtn) {
          testBtn.disabled = !enabled;
          testBtn.style.opacity = enabled ? "1" : "0.4";
          testBtn.style.cursor = enabled ? "pointer" : "not-allowed";

          // Also handle the button container div
          const buttonContainer = testBtn.closest("div");
          if (buttonContainer) {
            buttonContainer.style.opacity = enabled ? "1" : "0.4";
            buttonContainer.style.pointerEvents = enabled ? "" : "none";
          }
        }
      };

      // Set initial state
      toggleNotificationSettings(enableNotificationsCheckbox.checked);

      // Add change event listener
      enableNotificationsCheckbox.addEventListener("change", function () {
        toggleNotificationSettings(this.checked);
      });
    }

    // Auto-save disabled for notifications - using manual save button

    // Set up test notification button
    const testBtn = container.querySelector("#testNotificationBtn");
    if (testBtn) {
      testBtn.addEventListener("click", function () {
        const statusSpan = container.querySelector("#testNotificationStatus");

        // Note: Settings must be saved manually before testing
        console.log(
          "[SettingsForms] Test notification - ensure settings are saved first"
        );

        // Show testing status
        if (statusSpan) {
          statusSpan.textContent = "Testing...";
          statusSpan.style.color = "#6366f1";
        }

        // Send test notification
        fetch("./api/test-notification", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        })
          .then((response) => response.json())
          .then((data) => {
            if (statusSpan) {
              if (data.success) {
                statusSpan.textContent = "✓ Test sent successfully!";
                statusSpan.style.color = "#10b981";
              } else {
                statusSpan.textContent = `✗ Test failed: ${
                  data.error || "Unknown error"
                }`;
                statusSpan.style.color = "#ef4444";
              }

              // Clear status after 5 seconds
              setTimeout(() => {
                statusSpan.textContent = "";
              }, 5000);
            }
          })
          .catch((error) => {
            console.error("Test notification error:", error);
            if (statusSpan) {
              statusSpan.textContent = "✗ Test failed: Network error";
              statusSpan.style.color = "#ef4444";

              // Clear status after 5 seconds
              setTimeout(() => {
                statusSpan.textContent = "";
              }, 5000);
            }
          });
      });
    }

    // Set up manual save functionality for Notifications
    this.setupNotificationsManualSave(container, settings);
  },

  // Refresh Apps section to reflect Swaparr setting changes
  refreshAppsSection: function () {
    console.log(
      "[SettingsForms] Refreshing Apps section for Swaparr toggle change"
    );

    // Check if Apps module is available and refresh the currently selected app
    if (window.Apps && window.Apps.loadAppSettings) {
      // Get the currently selected app
      const appSelect = document.getElementById("appsAppSelect");
      if (appSelect && appSelect.value) {
        console.log(
          "[SettingsForms] Refreshing currently selected app:",
          appSelect.value
        );
        window.Apps.loadAppSettings(appSelect.value);
      } else {
        console.log(
          "[SettingsForms] No app currently selected in Apps section"
        );
      }
    } else {
      console.log("[SettingsForms] Apps module not available for refresh");
    }
  },

  // Unsaved changes warning system for both Swaparr and Settings
  addUnsavedChangesWarning: function () {
    console.log("[SettingsForms] Adding unsaved changes warning");

    // Add beforeunload event listener for page refresh warning
    if (!window.huntarrBeforeUnloadListener) {
      window.huntarrBeforeUnloadListener = function (e) {
        if (
          window.swaparrUnsavedChanges ||
          window.settingsUnsavedChanges ||
          window.notificationsUnsavedChanges ||
          window.sonarrUnsavedChanges ||
          window.radarrUnsavedChanges ||
          window.lidarrUnsavedChanges ||
          window.readarrUnsavedChanges ||
          window.whisparrUnsavedChanges ||
          window.erosUnsavedChanges ||
          window.prowlarrUnsavedChanges
        ) {
          e.preventDefault();
          e.returnValue = ""; // Standard way to trigger browser warning
          return ""; // For older browsers
        }
      };
      window.addEventListener(
        "beforeunload",
        window.huntarrBeforeUnloadListener
      );
    }
  },

  removeUnsavedChangesWarning: function () {
    console.log("[SettingsForms] Removing unsaved changes warning");

    // Only remove if all sections have no unsaved changes
    if (
      !window.swaparrUnsavedChanges &&
      !window.settingsUnsavedChanges &&
      !window.notificationsUnsavedChanges &&
      !window.sonarrUnsavedChanges &&
      !window.radarrUnsavedChanges &&
      !window.lidarrUnsavedChanges &&
      !window.readarrUnsavedChanges &&
      !window.whisparrUnsavedChanges &&
      !window.erosUnsavedChanges &&
      !window.prowlarrUnsavedChanges
    ) {
      // Remove beforeunload event listener
      if (window.huntarrBeforeUnloadListener) {
        window.removeEventListener(
          "beforeunload",
          window.huntarrBeforeUnloadListener
        );
        window.huntarrBeforeUnloadListener = null;
      }
    }
  },

  // Check for unsaved changes before navigation
  checkUnsavedChanges: function () {
    if (window.swaparrUnsavedChanges) {
      const userChoice = confirm(
        "You have unsaved changes in Swaparr settings.\n\n" +
          'Click "OK" to stay and save your changes.\n' +
          'Click "Cancel" to continue and lose your changes.'
      );

      if (userChoice) {
        // User chose to stay and save
        console.log(
          "[SettingsForms] User chose to stay and save Swaparr changes"
        );
        return false;
      } else {
        // User chose to leave and lose changes
        console.log(
          "[SettingsForms] User chose to leave and lose Swaparr changes"
        );
        window.swaparrUnsavedChanges = false;
        this.removeUnsavedChangesWarning();
        return true;
      }
    }

    if (window.settingsUnsavedChanges) {
      const userChoice = confirm(
        "You have unsaved changes in Settings.\n\n" +
          'Click "OK" to stay and save your changes.\n' +
          'Click "Cancel" to continue and lose your changes.'
      );

      if (userChoice) {
        // User chose to stay and save
        console.log(
          "[SettingsForms] User chose to stay and save Settings changes"
        );
        return false;
      } else {
        // User chose to leave and lose changes
        console.log(
          "[SettingsForms] User chose to leave and lose Settings changes"
        );
        window.settingsUnsavedChanges = false;
        this.removeUnsavedChangesWarning();
        return true;
      }
    }

    if (window.notificationsUnsavedChanges) {
      const userChoice = confirm(
        "You have unsaved changes in Notifications.\n\n" +
          'Click "OK" to stay and save your changes.\n' +
          'Click "Cancel" to continue and lose your changes.'
      );

      if (userChoice) {
        // User chose to stay and save
        console.log(
          "[SettingsForms] User chose to stay and save Notifications changes"
        );
        return false;
      } else {
        // User chose to leave and lose changes
        console.log(
          "[SettingsForms] User chose to leave and lose Notifications changes"
        );
        window.notificationsUnsavedChanges = false;
        this.removeUnsavedChangesWarning();
        return true;
      }
    }

    // Check each app instance for unsaved changes
    const appTypes = [
      "sonarr",
      "radarr",
      "lidarr",
      "readarr",
      "whisparr",
      "eros",
      "prowlarr",
    ];
    for (const appType of appTypes) {
      const unsavedChangesVar = `${appType}UnsavedChanges`;
      if (window[unsavedChangesVar]) {
        const appDisplayName =
          appType.charAt(0).toUpperCase() + appType.slice(1);
        const userChoice = confirm(
          `You have unsaved changes in ${appDisplayName} settings.\n\n` +
            'Click "OK" to stay and save your changes.\n' +
            'Click "Cancel" to continue and lose your changes.'
        );

        if (userChoice) {
          // User chose to stay and save
          console.log(
            `[SettingsForms] User chose to stay and save ${appDisplayName} changes`
          );
          return false;
        } else {
          // User chose to leave and lose changes
          console.log(
            `[SettingsForms] User chose to leave and lose ${appDisplayName} changes`
          );
          window[unsavedChangesVar] = false;
          this.removeUnsavedChangesWarning();
          return true;
        }
      }
    }

    return true; // No unsaved changes, can proceed
  },

  // Generate Prowlarr settings form
  generateProwlarrForm: function (container, settings = {}) {
    // Ensure settings is a valid object
    if (!settings || typeof settings !== "object") {
      settings = {};
    }

    // Add data-app-type attribute to container
    container.setAttribute("data-app-type", "prowlarr");

    // Add save button at the top
    let prowlarrSaveButtonHtml = `
            <div style="margin-bottom: 20px;">
                <button type="button" id="prowlarr-save-button" disabled style="
                    background: #6b7280;
                    color: #9ca3af;
                    border: 1px solid #4b5563;
                    padding: 8px 16px;
                    border-radius: 6px;
                    font-size: 14px;
                    font-weight: 500;
                    cursor: not-allowed;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    transition: all 0.2s ease;
                ">
                    <i class="fas fa-save"></i>
                    Save Changes
                </button>
            </div>
        `;

    // Create the Prowlarr configuration container
    let prowlarrHtml = `
            <div class="settings-group" style="
                background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%);
                border: 2px solid rgba(90, 109, 137, 0.3);
                border-radius: 12px;
                padding: 20px;
                margin: 15px 0 25px 0;
                box-shadow: 0 4px 12px rgba(90, 109, 137, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1);
            ">
                <h3>Prowlarr Configuration</h3>
                <div class="prowlarr-container">
                    <div class="instance-item" data-instance-id="0">
                        <div class="instance-header">
                            <h4>Prowlarr</h4>
                            <div class="instance-actions">
                                <span class="connection-status" id="prowlarr-status-0"></span>
                            </div>
                        </div>
                        <div class="instance-content">
                            <div class="setting-item">
                                <label for="prowlarr-enabled-0">Enabled:</label>
                                <label class="toggle-switch" style="width:40px; height:20px; display:inline-block; position:relative;">
                                    <input type="checkbox" id="prowlarr-enabled-0" name="enabled" ${
                                      settings.enabled !== false
                                        ? "checked"
                                        : ""
                                    }>
                                    <span class="toggle-slider" style="position:absolute; cursor:pointer; top:0; left:0; right:0; bottom:0; background-color:#3d4353; border-radius:20px; transition:0.4s;"></span>
                                </label>
                                <p class="setting-help">Enable or disable Prowlarr integration</p>
                            </div>
                            <div class="setting-item">
                                <label for="prowlarr-url-0">URL:</label>
                                <input type="text" id="prowlarr-url-0" name="api_url" value="${
                                  settings.api_url || ""
                                }" placeholder="Base URL for Prowlarr (e.g., http://localhost:9696)" data-instance-index="0">
                                <p class="setting-help">Base URL for Prowlarr (e.g., http://localhost:9696)</p>
                            </div>
                            <div class="setting-item">
                                <label for="prowlarr-key-0">API Key:</label>
                                <input type="text" id="prowlarr-key-0" name="api_key" value="${
                                  settings.api_key || ""
                                }" placeholder="API key for Prowlarr" data-instance-index="0">
                                <p class="setting-help">API key for Prowlarr</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

    // Set the content with save button at the top
    container.innerHTML = prowlarrSaveButtonHtml + prowlarrHtml;

    // Setup auto-detection (like Sonarr)
    this.setupProwlarrAutoDetection(container);

    // Set up manual save functionality for Prowlarr
    this.setupAppManualSave(container, "prowlarr", settings);
  },

  // Setup auto-detection for Prowlarr (similar to Sonarr)
  setupProwlarrAutoDetection: function (container) {
    console.log("[SettingsForms] Setting up Prowlarr auto-detection");

    // Find URL and API key inputs
    const urlInput = container.querySelector("#prowlarr-url-0");
    const apiKeyInput = container.querySelector("#prowlarr-key-0");

    if (urlInput) {
      urlInput.addEventListener("input", () => {
        setTimeout(() => {
          this.checkConnectionStatus("prowlarr", 0);
        }, 1000); // 1 second delay to prevent spam while typing
      });
      urlInput.addEventListener("blur", () => {
        this.checkConnectionStatus("prowlarr", 0);
      });
    }

    if (apiKeyInput) {
      apiKeyInput.addEventListener("input", () => {
        setTimeout(() => {
          this.checkConnectionStatus("prowlarr", 0);
        }, 1000); // 1 second delay to prevent spam while typing
      });
      apiKeyInput.addEventListener("blur", () => {
        this.checkConnectionStatus("prowlarr", 0);
      });
    }

    // Initial status check if URL and key are provided
    if (
      urlInput &&
      apiKeyInput &&
      urlInput.value.trim() &&
      apiKeyInput.value.trim()
    ) {
      setTimeout(() => {
        this.checkConnectionStatus("prowlarr", 0);
      }, 500);
    }
  },
};

// Add CSS for toggle circle
const styleEl = document.createElement("style");
styleEl.innerHTML = `
    .toggle-switch input:checked + .toggle-slider {
        background-color: #3498db !important;
    }
    .toggle-slider:before {
        position: absolute;
        content: "";
        height: 14px;
        width: 14px;
        left: 3px;
        bottom: 3px;
        background-color: white;
        transition: .4s;
        border-radius: 50%;
    }
    .toggle-switch input:checked + .toggle-slider:before {
        transform: translateX(20px);
    }
    
    /* Align setting help text 3 characters to the left */
    .setting-help {
        margin-left: -3ch !important;
    }
    
    /* Mobile-friendly dropdown styling */
    @media (max-width: 768px) {
        
        .setting-item select {
            width: 100% !important;
            max-width: none !important;
        }
    }
`;
document.head.appendChild(styleEl);

// Make SettingsForms globally available
window.SettingsForms = SettingsForms;
