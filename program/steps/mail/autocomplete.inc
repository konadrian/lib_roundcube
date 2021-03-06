<?php
/* {[The file is published on the basis of YetiForce Public License that can be found in the following directory: licenses/License.html]} */
// <--------   YetiForce Sp. z o.o.   -------->
$search = rcube_utils::get_input_value('_search', rcube_utils::INPUT_GPC, true);
$sid = rcube_utils::get_input_value('_reqid', rcube_utils::INPUT_GPC);
if (strlen($search)) {
    $contacts = [];
    $crmUserId = false;
    if (isset($_SESSION['crm']['id'])) {
        $crmUserId = $_SESSION['crm']['id'];
    }
    if ($RCMAIL->user->data['crm_user_id']) {
        $crmUserId = $RCMAIL->user->data['crm_user_id'];
    }
    if ($crmUserId) {
        $addressBookFile = $RCMAIL->config->get('root_directory') . 'cache/addressBook/mails_' . $crmUserId . '.php';
        if (is_file($addressBookFile)) {
            include $addressBookFile;
						$contacts = preg_grep("/{$search}/i", $bookMails);
        }
    }
}
$OUTPUT->command('ksearch_query_results', array_values($contacts), $search, $sid);
$OUTPUT->send();
// <--------   YetiForce Sp. z o.o.   -------->
