/* {[The file is published on the basis of MIT License]} */
window.rcmail &&
	rcmail.addEventListener('init', function(evt) {
		window.crm = getCrmWindow();
		loadActionBar();
		rcmail.env.message_commands.push('yetiforce.importICS');
		rcmail.register_command(
			'yetiforce.importICS',
			function(part, type) {
				jQuery.ajax({
					type: 'POST',
					url:
						'./?_task=mail&_action=plugin.yetiforce.importIcs&_mbox=' +
						urlencode(rcmail.env.mailbox) +
						'&_uid=' +
						urlencode(rcmail.env.uid) +
						'&_part=' +
						part +
						'&_type=' +
						type,
					async: false,
					success: function(data) {
						data = JSON.parse(data);
						window.crm.Vtiger_Helper_Js.showPnotify({
							text: data['message'],
							type: 'info',
							animation: 'show'
						});
					}
				});
			},
			true
		);
	});

function loadActionBar() {
	var content = $('#ytActionBarContent');
	var params = {
		module: 'OSSMail',
		view: 'MailActionBar',
		uid: rcmail.env.uid,
		folder: rcmail.env.mailbox,
		rcId: rcmail.env.user_id
	};
	window.crm.AppConnector.request(params).done(function(response) {
		content.find('.ytHeader').html(response);
		$('#messagecontent').css('top', content.outerHeight() + $('#messageheader').outerHeight() + 'px');
		registerEvents(content);
	});
}

function registerEvents(content) {
	registerAddRecord(content);
	registerAddAttachments(content);
	registerAddReletedRecord(content);
	registerSelectRecord(content);
	registerRemoveRecord(content);
	registerImportMail(content);
	window.crm.app.registerPopover(content.closest('body'));
	var block = content.find('.ytHeader .js-data');
	content.find('.hideBtn').click(function() {
		var button = $(this);
		var icon = button.find('.glyphicon');

		if (button.data('type') == '0') {
			button.data('type', '1');
			icon.removeClass('glyphicon-chevron-up').addClass('glyphicon-chevron-down');
		} else {
			button.data('type', '0');
			icon.removeClass('glyphicon-chevron-down').addClass('glyphicon-chevron-up');
		}
		block.toggle();
		$(window).trigger('resize');
	});
}

function registerImportMail(content) {
	let clicked = false;
	content.find('.importMail').click(function(e) {
		if (clicked) return false;
		clicked = true;
		window.crm.Vtiger_Helper_Js.showPnotify({
			text: window.crm.app.vtranslate('StartedDownloadingEmail'),
			type: 'info'
		});
		window.crm.AppConnector.request({
			module: 'OSSMail',
			action: 'ImportMail',
			uid: rcmail.env.uid,
			folder: rcmail.env.mailbox,
			rcId: rcmail.env.user_id
		})
			.done(function(data) {
				loadActionBar();
				window.crm.Vtiger_Helper_Js.showPnotify({
					text: window.crm.app.vtranslate('AddFindEmailInRecord'),
					type: 'success'
				});
			})
			.fail(function() {
				clicked = false;
			});
	});
}

function registerRemoveRecord(content) {
	content.find('button.removeRecord').click(function(e) {
		var row = $(e.currentTarget).closest('.rowRelatedRecord');
		removeRecord(row.data('id'));
	});
}

function registerSelectRecord(content) {
	let id = content.find('#mailActionBarID').val();
	content.find('button.selectRecord').click(function(e) {
		let relationSelect = content.find('#addRelationSelect').val();
		let getCacheModule = window.crm.app.moduleCacheGet('selectedModuleName');
		if (getCacheModule === 'undefined' || relationSelect !== getCacheModule) {
			window.crm.app.moduleCacheSet('selectedModuleName', relationSelect);
		}
		let relParams = {
			mailId: id
		};
		if ($(this).data('type') == 0) {
			var module = $(this)
				.closest('.js-head-container')
				.find('.module')
				.val();
			if (module === null) {
				return;
			}
		} else {
			var module = $(this).data('module');
			relParams.crmid = $(this)
				.closest('.rowRelatedRecord')
				.data('id');
			relParams.mod = $(this)
				.closest('.rowRelatedRecord')
				.data('module');
			relParams.newModule = module;
		}
		showPopup(
			{
				module: module,
				src_module: 'OSSMailView',
				src_record: id
			},
			relParams
		);
	});
}

function registerAddReletedRecord(content) {
	var id = content.find('#mailActionBarID').val();
	content.find('button.addRelatedRecord').click(function(e) {
		var targetElement = $(e.currentTarget);
		var row = targetElement.closest('.rowRelatedRecord');
		var params = { sourceModule: row.data('module') };
		showQuickCreateForm(targetElement.data('module'), row.data('id'), params);
	});

}
function registerAddAttachments(content) {
	const id = content.find('#mailActionBarID').val();
	content.find('button.addAttachments').click(function (e) {
		let row = $(e.currentTarget).closest('.rowRelatedRecord');
		let relatedModule = row.data('module');
		let relatedRecordId = row.data('id');
		window.crm.app.showRecordsList({
				module: 'Documents',
				related_parent_module: 'OSSMailView',
				related_parent_id: id,
				multi_select: true,
				record_selected: true,
			}, (modal, instance) => {
			instance.setSelectEvent((responseData, e) => {
				window.crm.AppConnector.request({
					async: false,
					dataType: 'json',
					data: {
						module: relatedModule,
						action: 'RelationAjax',
						mode: 'addRelation',
						related_module: 'Documents',
						src_record: relatedRecordId,
						related_record_list: JSON.stringify(Object.keys(responseData))
					}
				}).done(function (data) {
					let notifyParams = {
						text: window.crm.app.vtranslate('JS_DOCUMENTS_ADDED'),
						type: 'success',
						animation: 'show'
					};
					if (!data['success']) {
						notifyParams.type = 'error';
						notifyParams.text = window.crm.app.vtranslate('JS_ERROR');
					}
					window.crm.Vtiger_Helper_Js.showPnotify(notifyParams);
					loadActionBar();
				});
			});
		});
	});
}
function registerAddRecord(content) {
	var id = content.find('#mailActionBarID').val();
	let getCacheModule = window.crm.app.moduleCacheGet('selectedModuleName');
	if (getCacheModule) {
		content.find('#addRelationSelect').val(getCacheModule);
	}
	content.find('button.addRecord').click(function(e) {
		var relationSelect = content.find('#addRelationSelect').val();
		if (getCacheModule === 'undefined' || relationSelect !== getCacheModule) {
			window.crm.app.moduleCacheSet('selectedModuleName', relationSelect);
		}
		var col = $(e.currentTarget).closest('.js-head-container');
		let selectValue = col.find('.module').val();
		if (selectValue !== null) {
			let relatedRecords = [];
			content
				.find('.js-data')
				.find('.rowRelatedRecord')
				.each((i, record) => {
					let data = $(record).data();
					relatedRecords.push({ module: data.module, id: data.id });
				});
			showQuickCreateForm(selectValue, id, { relatedRecords: relatedRecords });
		}
	});
}

function removeRecord(crmid) {
	const id = $('#mailActionBarID').val();
	let params = {};
	params.data = {
		module: 'OSSMail',
		action: 'ExecuteActions',
		mode: 'removeRelated',
		params: {
			mailId: id,
			crmid: crmid
		}
	};
	params.async = false;
	params.dataType = 'json';
	window.crm.AppConnector.request(params).done(function(data) {
		const response = data['result'];
		let notifyParams = {
			text: response['data'],
			animation: 'show'
		};
		if (response['success']) {
			notifyParams = {
				text: response['data'],
				type: 'info',
				animation: 'show'
			};
		}
		window.crm.Vtiger_Helper_Js.showPnotify(notifyParams);
		loadActionBar();
	});
}

function showPopup(params, actionsParams) {
	actionsParams['newModule'] = params['module'];
	window.crm.app.showRecordsList(params, (modal, instance) => {
		instance.setSelectEvent((responseData, e) => {
			actionsParams['newCrmId'] = responseData.id;
			window.crm.AppConnector.request({
				async: false,
				dataType: 'json',
				data: {
					module: 'OSSMail',
					action: 'ExecuteActions',
					mode: 'addRelated',
					params: actionsParams
				}
			}).done(function(data) {
				let response = data['result'];
				if (response['success']) {
					var notifyParams = {
						text: response['data'],
						type: 'info',
						animation: 'show'
					};
				} else {
					var notifyParams = {
						text: response['data'],
						animation: 'show'
					};
				}
				window.crm.Vtiger_Helper_Js.showPnotify(notifyParams);
				loadActionBar();
			});
		});
	});
}

function showQuickCreateForm(moduleName, record, params = {}) {
	const content = $('#ytActionBarContent');
	let relatedParams = {},
		sourceModule = 'OSSMailView';
	if (params['sourceModule']) {
		sourceModule = params['sourceModule'];
	}
	const postShown = function(data) {
		var index, queryParam, queryParamComponents;
		$('<input type="hidden" name="sourceModule" value="' + sourceModule + '" />').appendTo(data);
		$('<input type="hidden" name="sourceRecord" value="' + record + '" />').appendTo(data);
		$('<input type="hidden" name="relationOperation" value="true" />').appendTo(data);
	};
	const postQuickCreate = function(data) {
		loadActionBar();
	};
	const ids = {
		link: 'modulesLevel0',
		process: 'modulesLevel1',
		subprocess: 'modulesLevel2',
		subprocess_sl: 'modulesLevel3',
		linkextend: 'modulesLevel4'
	};
	for (var i in ids) {
		var element = content.find('#' + ids[i]);
		var value = element.length ? JSON.parse(element.val()) : [];
		if ($.inArray(sourceModule, value) >= 0) {
			relatedParams[i] = record;
		}
	}
	const fillNameFields = first => {
		const nameData = rcmail.env.fromName.split(' ');
		const firstName = nameData.shift();
		const lastName = nameData.join(' ');
		return first ? firstName : lastName;
	};
	let autoCompleteMapRaw = content.find('.js-mailAutoCompleteFields').val();
	let autoCompleteMap = autoCompleteMapRaw ? JSON.parse(autoCompleteMapRaw) : [];
	if (autoCompleteMap && autoCompleteMap[moduleName]) {
		let map = autoCompleteMap[moduleName];
		for (let name in map) {
			if (map.hasOwnProperty(name) && map[name]) {
				switch (map[name]) {
					case 'fromNameFirstPart':
						relatedParams[name] = fillNameFields(true);
						break;
					case 'fromNameSecondPart':
						relatedParams[name] = fillNameFields(false);
						break;
					case 'fromName':
						relatedParams[name] = rcmail.env.fromName;
						break;
					case 'subject':
						relatedParams[name] = rcmail.env.subject;
						break;
					case 'email':
						relatedParams[name] = rcmail.env.fromMail;
						break;
				}
			}
		}
	}

	relatedParams['email'] = rcmail.env.fromMail;
	relatedParams['email1'] = rcmail.env.fromMail;
	let messageBody = $('#messagebody').clone();
	messageBody.find('.image-attachment').remove();
	relatedParams['description'] = messageBody.text();
	//relatedParams['related_to'] = record;
	if (params.relatedRecords !== undefined) {
		relatedParams['relatedRecords'] = params.relatedRecords;
	}
	relatedParams['sourceModule'] = sourceModule;
	relatedParams['sourceRecord'] = record;
	relatedParams['relationOperation'] = true;
	const quickCreateParams = {
		callbackFunction: data => {
			loadActionBar();
		},
		callbackPostShown: postShown,
		data: relatedParams,
		noCache: true
	};
	const headerInstance = new window.crm.Vtiger_Header_Js();
	headerInstance.quickCreateModule(moduleName, quickCreateParams);
}

function getCrmWindow() {
	if (opener !== null && opener.parent.CONFIG == 'object') {
		return opener.parent;
	} else if (typeof parent.CONFIG == 'object') {
		return parent;
	} else if (typeof parent.parent.CONFIG == 'object') {
		return parent.parent;
	} else if (typeof opener.crm.CONFIG == 'object') {
		return opener.crm;
	}
	return false;
}
