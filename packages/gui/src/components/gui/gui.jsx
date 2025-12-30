import classNames from 'classnames';
import omit from 'lodash.omit';
import PropTypes from 'prop-types';
import React, {useEffect} from 'react';
import {FormattedMessage, useIntl} from 'react-intl';
import {connect} from 'react-redux';
import MediaQuery from 'react-responsive';
import {Tab, Tabs, TabList, TabPanel} from 'react-tabs';
import tabStyles from 'react-tabs/style/react-tabs.css';
import VM from 'clipcc-vm';
import Renderer from 'clipcc-render';

import Blocks from '../../containers/blocks.jsx';
import CostumeTab from '../../containers/costume-tab.jsx';
import TargetPane from '../../containers/target-pane.jsx';
import SoundTab from '../../containers/sound-tab.jsx';
import StageWrapper from '../../containers/stage-wrapper.jsx';
import Loader from '../loader/loader.jsx';
import Box from '../box/box.jsx';
import MenuBar from '../menu-bar/menu-bar.jsx';
import CostumeLibrary from '../../containers/costume-library.jsx';
import BackdropLibrary from '../../containers/backdrop-library.jsx';
import Watermark from '../../containers/watermark.jsx';

import Backpack from '../../containers/backpack.jsx';
import ExtensionsButton from '../extension-button/extension-button.jsx';
import WebGlModal from '../../containers/webgl-modal.jsx';
import Alerts from '../../containers/alerts.jsx';
import DragLayer from '../../containers/drag-layer.jsx';
import ConnectionModal from '../../containers/connection-modal.jsx';
import TelemetryModal from '../telemetry-modal/telemetry-modal.jsx';
import SettingsModal from '../../containers/settings-modal.jsx';

import layout, {STAGE_SIZE_MODES} from '../../lib/layout-constants';
import {resolveStageSize} from '../../lib/screen-utils';
import {themeMap} from '../../lib/themes';
import {AccountMenuOptionsPropTypes} from '../../lib/account-menu-options';

import styles from './gui.css';
import codeIcon from './icon--code.svg';
import costumesIcon from './icon--costumes.svg';
import soundsIcon from './icon--sounds.svg';
import {setPlatform} from '../../reducers/platform.js';
import {PLATFORM} from '../../lib/platform.js';

// Cache this value to only retrieve it once the first time.
// Assume that it doesn't change for a session.
let isRendererSupported = null;

const GUIComponent = props => {
    const intl = useIntl();
    const {
        accountMenuOptions,
        accountNavOpen,
        activeTabIndex,
        alertsVisible,
        authorId,
        authorThumbnailUrl,
        authorUsername,
        basePath,
        backdropLibraryVisible,
        backpackHost,
        backpackVisible,
        blocksTabVisible,
        canChangeLanguage,
        canChangeTheme,
        canCreateNew,
        canEditTitle,
        canManageFiles,
        canRemix,
        canSave,
        canCreateCopy,
        canShare,
        canUseCloud,
        children,
        connectionModalVisible,
        costumeLibraryVisible,
        costumesTabVisible,
        enableCommunity,
        isCreating,
        isFullScreen,
        isPlayerOnly,
        isRtl,
        isShared,
        isTelemetryEnabled,
        loading,
        logo,
        manuallySaveThumbnails,
        menuBarHidden,
        renderLogin,
        onClickAbout,
        onClickAccountNav,
        onCloseAccountNav,
        onLogOut,
        onOpenRegistration,
        onToggleLoginOpen,
        onActivateCostumesTab,
        onActivateSoundsTab,
        onActivateTab,
        onClickLogo,
        onExtensionButtonClick,
        onNewSpriteClick,
        onNewLibraryCostumeClick,
        onNewLibraryBackdropClick,
        onProjectTelemetryEvent,
        onRequestCloseBackdropLibrary,
        onRequestCloseCostumeLibrary,
        onRequestCloseSettingsModal, // eslint-disable-line no-unused-vars
        onRequestCloseTelemetryModal,
        onSeeCommunity,
        onShare,
        onShowPrivacyPolicy,
        onStartSelectingFileUpload,
        onTelemetryModalCancel,
        onTelemetryModalOptIn,
        onTelemetryModalOptOut,
        onUpdateProjectThumbnail,
        settingsModalVisible,
        showComingSoon,
        showNewFeatureCallouts,
        soundsTabVisible,
        stageSizeMode,
        targetIsStage,
        telemetryModalVisible,
        theme,
        username,
        userOwnsProject,
        hideTutorialProjects, // eslint-disable-line @typescript-eslint/no-unused-vars
        useExternalPeripheralList,
        vm,
        stageWidth,
        stageHeight,
        storage, // eslint-disable-line @typescript-eslint/no-unused-vars
        ...componentProps
    } = omit(props, 'dispatch', 'setPlatform', 'intl');
    if (children) {
        return <Box {...componentProps}>{children}</Box>;
    }

    useEffect(() => {
        if (props.platform) {
            setPlatform(props.platform);
        }
    }, [props.platform]);

    const tabClassNames = {
        tabs: styles.tabs,
        tab: classNames(tabStyles.reactTabsTab, styles.tab),
        tabList: classNames(tabStyles.reactTabsTabList, styles.tabList),
        tabPanel: classNames(tabStyles.reactTabsTabPanel, styles.tabPanel),
        tabPanelSelected: classNames(tabStyles.reactTabsTabPanelSelected, styles.isSelected),
        tabSelected: classNames(tabStyles.reactTabsTabSelected, styles.isSelected)
    };

    if (isRendererSupported === null) {
        isRendererSupported = Renderer.isSupported();
    }

    return (<MediaQuery minWidth={layout.fullSizeMinWidth}>{isFullSize => {
        const stageSize = resolveStageSize(stageSizeMode, isFullSize);
        const boxStyles = classNames(styles.bodyWrapper, {
            [styles.bodyWrapperWithoutMenuBar]: menuBarHidden
        });

        return isPlayerOnly ? (
            <StageWrapper
                isFullScreen={isFullScreen}
                isRendererSupported={isRendererSupported}
                isRtl={isRtl}
                loading={loading}
                manuallySaveThumbnails={
                    manuallySaveThumbnails &&
                    userOwnsProject
                }
                onUpdateProjectThumbnail={onUpdateProjectThumbnail}
                stageSize={STAGE_SIZE_MODES.large}
                vm={vm}
                stageWidth={stageWidth}
                stageHeight={stageHeight}
            >
                {alertsVisible ? (
                    <Alerts className={styles.alertsContainer} />
                ) : null}
            </StageWrapper>
        ) : (
            <Box
                className={styles.pageWrapper}
                dir={isRtl ? 'rtl' : 'ltr'}
                {...componentProps}
            >
                {telemetryModalVisible ? (
                    <TelemetryModal
                        isRtl={isRtl}
                        isTelemetryEnabled={isTelemetryEnabled}
                        onCancel={onTelemetryModalCancel}
                        onOptIn={onTelemetryModalOptIn}
                        onOptOut={onTelemetryModalOptOut}
                        onRequestClose={onRequestCloseTelemetryModal}
                        onShowPrivacyPolicy={onShowPrivacyPolicy}
                    />
                ) : null}
                {loading ? (
                    <Loader />
                ) : null}
                {isCreating ? (
                    <Loader messageId="gui.loader.creating" />
                ) : null}
                {isRendererSupported ? null : (
                    <WebGlModal isRtl={isRtl} />
                )}
                {settingsModalVisible ? (
                    <SettingsModal />
                ) : null}
                {alertsVisible ? (
                    <Alerts className={styles.alertsContainer} />
                ) : null}
                {connectionModalVisible ? (
                    <ConnectionModal
                        useExternalPeripheralList={useExternalPeripheralList}
                        vm={vm}
                    />
                ) : null}
                {costumeLibraryVisible ? (
                    <CostumeLibrary
                        vm={vm}
                        onRequestClose={onRequestCloseCostumeLibrary}
                    />
                ) : null}
                {backdropLibraryVisible ? (
                    <BackdropLibrary
                        vm={vm}
                        onRequestClose={onRequestCloseBackdropLibrary}
                    />
                ) : null}
                {!menuBarHidden && <MenuBar
                    ariaRole="banner"
                    ariaLabel={intl.formatMessage({
                        defaultMessage: 'Menu topbar',
                        description: 'ARIA label for the menu topbar',
                        id: 'gui.aria.menuTopbar'
                    })}
                    accountNavOpen={accountNavOpen}
                    authorId={authorId}
                    authorThumbnailUrl={authorThumbnailUrl}
                    authorUsername={authorUsername}
                    canChangeLanguage={canChangeLanguage}
                    canChangeTheme={canChangeTheme}
                    canCreateCopy={canCreateCopy}
                    canCreateNew={canCreateNew}
                    canEditTitle={canEditTitle}
                    canManageFiles={canManageFiles}
                    canRemix={canRemix}
                    canSave={canSave}
                    canShare={canShare}
                    className={styles.menuBarPosition}
                    enableCommunity={enableCommunity}
                    isShared={isShared}
                    logo={logo}
                    renderLogin={renderLogin}
                    showComingSoon={showComingSoon}
                    onClickAbout={onClickAbout}
                    onClickAccountNav={onClickAccountNav}
                    onClickLogo={onClickLogo}
                    onCloseAccountNav={onCloseAccountNav}
                    onLogOut={onLogOut}
                    onOpenRegistration={onOpenRegistration}
                    onProjectTelemetryEvent={onProjectTelemetryEvent}
                    onSeeCommunity={onSeeCommunity}
                    onShare={onShare}
                    onStartSelectingFileUpload={onStartSelectingFileUpload}
                    onToggleLoginOpen={onToggleLoginOpen}
                    userOwnsProject={userOwnsProject}
                    username={username}
                    accountMenuOptions={accountMenuOptions}
                />}
                <Box className={boxStyles}>
                    <Box className={styles.flexWrapper}>
                        <Box
                            role="main"
                            aria-label={intl.formatMessage({
                                defaultMessage: 'Editor',
                                description: 'ARIA label for the main coding area',
                                id: 'gui.aria.editorWrapper'
                            })}
                            className={styles.editorWrapper}
                        >
                            <Tabs
                                forceRenderTabPanel
                                className={tabClassNames.tabs}
                                selectedIndex={activeTabIndex}
                                selectedTabClassName={tabClassNames.tabSelected}
                                selectedTabPanelClassName={tabClassNames.tabPanelSelected}
                                onSelect={onActivateTab}

                                // TODO: focusTabOnClick should be true for accessibility, but currently conflicts
                                // with nudge operations in the paint editor. We'll likely need to manage focus
                                // differently within the paint editor before we can turn this back on.
                                // Repro steps:
                                // 1. Click the Costumes tab
                                // 2. Select something in the paint editor (say, the cat's face)
                                // 3. Press the left or right arrow key
                                // Desired behavior: the face should nudge left or right
                                // Actual behavior: the Code or Sounds tab is now focused
                                focusTabOnClick={false}
                            >
                                <TabList className={tabClassNames.tabList}>
                                    <Tab className={tabClassNames.tab}>
                                        <img
                                            draggable={false}
                                            src={codeIcon}
                                        />
                                        <FormattedMessage
                                            defaultMessage="Code"
                                            description="Button to get to the code panel"
                                            id="gui.gui.codeTab"
                                        />
                                    </Tab>
                                    <Tab
                                        className={tabClassNames.tab}
                                        onClick={onActivateCostumesTab}
                                    >
                                        <img
                                            draggable={false}
                                            src={costumesIcon}
                                        />
                                        {targetIsStage ? (
                                            <FormattedMessage
                                                defaultMessage="Backdrops"
                                                description="Button to get to the backdrops panel"
                                                id="gui.gui.backdropsTab"
                                            />
                                        ) : (
                                            <FormattedMessage
                                                defaultMessage="Costumes"
                                                description="Button to get to the costumes panel"
                                                id="gui.gui.costumesTab"
                                            />
                                        )}
                                    </Tab>
                                    <Tab
                                        className={tabClassNames.tab}
                                        onClick={onActivateSoundsTab}
                                    >
                                        <img
                                            draggable={false}
                                            src={soundsIcon}
                                        />
                                        <FormattedMessage
                                            defaultMessage="Sounds"
                                            description="Button to get to the sounds panel"
                                            id="gui.gui.soundsTab"
                                        />
                                    </Tab>
                                </TabList>
                                <TabPanel className={tabClassNames.tabPanel}>
                                    <Box

                                        className={styles.blocksWrapper}
                                        role="region"
                                        aria-label={intl.formatMessage({
                                            defaultMessage: 'Code Editor Panel',
                                            description: 'ARIA label for the code editor panel',
                                            id: 'gui.aria.blocksPalette'
                                        })}
                                    >
                                        <Blocks
                                            key={theme}
                                            canUseCloud={canUseCloud}
                                            grow={1}
                                            isVisible={blocksTabVisible}
                                            options={{
                                                media: `${basePath}static/${themeMap[theme].blocksMediaFolder}/`
                                            }}
                                            stageSize={stageSize}
                                            theme={theme}
                                            vm={vm}
                                            showNewFeatureCallouts={showNewFeatureCallouts}
                                            username={username}
                                        />
                                    </Box>
                                    <ExtensionsButton
                                        activeTabIndex={activeTabIndex}
                                        intl={intl}
                                        showNewFeatureCallouts={showNewFeatureCallouts}
                                        onExtensionButtonClick={onExtensionButtonClick}
                                        username={username}
                                    />
                                    <Box className={styles.watermark}>
                                        <Watermark />
                                    </Box>
                                </TabPanel>
                                <TabPanel className={tabClassNames.tabPanel}>
                                    {costumesTabVisible ? <CostumeTab
                                        ariaLabel={targetIsStage ?
                                            intl.formatMessage({
                                                defaultMessage: 'Backdrops Editor Panel',
                                                description: 'ARIA label for the backdrops editor panel',
                                                id: 'gui.aria.backdropsEditorPanel'
                                            }) :
                                            intl.formatMessage({
                                                defaultMessage: 'Costumes Editor Panel',
                                                description: 'ARIA label for the costumes editor panel',
                                                id: 'gui.aria.costumesEditorPanel'
                                            })
                                        }
                                        ariaRole="region"
                                        vm={vm}
                                        onNewLibraryBackdropClick={onNewLibraryBackdropClick}
                                        onNewLibraryCostumeClick={onNewLibraryCostumeClick}
                                    /> : null}
                                </TabPanel>
                                <TabPanel className={tabClassNames.tabPanel}>
                                    {soundsTabVisible ?
                                        <SoundTab
                                            ariaLabel={intl.formatMessage({
                                                defaultMessage: 'Sounds Editor Panel',
                                                description: 'ARIA label for the sounds editor panel',
                                                id: 'gui.aria.soundsEditorPanel'
                                            })}
                                            ariaRole="region"
                                            vm={vm}
                                        /> : null}
                                </TabPanel>
                            </Tabs>
                            {backpackVisible ? (
                                <Backpack
                                    ariaRole="region"
                                    ariaLabel={intl.formatMessage({
                                        defaultMessage: 'Backpack',
                                        description: 'ARIA label for the backpack',
                                        id: 'gui.aria.backpack'
                                    })}
                                    host={backpackHost}
                                />
                            ) : null}
                        </Box>

                        <Box
                            role="complementary"
                            aria-label={intl.formatMessage({
                                defaultMessage: 'Stage and Target',
                                description: 'ARIA label for the stage and target pane',
                                id: 'gui.aria.stageAndTarget'
                            })}
                            className={classNames(styles.stageAndTargetWrapper, styles[stageSize])}
                        >
                            <StageWrapper
                                isFullScreen={isFullScreen}
                                isRendererSupported={isRendererSupported}
                                isRtl={isRtl}
                                stageSize={stageSize}
                                vm={vm}
                                stageWidth={stageWidth}
                                stageHeight={stageHeight}
                                ariaRole="region"
                                ariaLabel={intl.formatMessage({
                                    defaultMessage: 'Stage',
                                    description: 'ARIA label for the stage',
                                    id: 'gui.aria.stage'
                                })}
                            />
                            <Box
                                className={styles.targetWrapper}
                                role="region"
                                aria-label={intl.formatMessage({
                                    defaultMessage: 'Target Pane',
                                    description: 'ARIA label for the target pane',
                                    id: 'gui.aria.targetPane'
                                })}
                            >
                                <TargetPane
                                    stageSize={stageSize}
                                    vm={vm}
                                    onNewSpriteClick={onNewSpriteClick}
                                    onNewBackdropClick={onNewLibraryBackdropClick}
                                />
                            </Box>
                        </Box>
                    </Box>
                </Box>
                <DragLayer />
            </Box>
        );
    }}</MediaQuery>);
};

GUIComponent.propTypes = {
    accountNavOpen: PropTypes.bool,
    accountMenuOptions: AccountMenuOptionsPropTypes,
    activeTabIndex: PropTypes.number,
    authorId: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]), // can be false
    authorThumbnailUrl: PropTypes.string,
    authorUsername: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]), // can be false
    backdropLibraryVisible: PropTypes.bool,
    backpackHost: PropTypes.string,
    backpackVisible: PropTypes.bool,
    basePath: PropTypes.string,
    blocksTabVisible: PropTypes.bool,
    canChangeLanguage: PropTypes.bool,
    canChangeTheme: PropTypes.bool,
    canCreateCopy: PropTypes.bool,
    canCreateNew: PropTypes.bool,
    canEditTitle: PropTypes.bool,
    canManageFiles: PropTypes.bool,
    canRemix: PropTypes.bool,
    canSave: PropTypes.bool,
    canShare: PropTypes.bool,
    canUseCloud: PropTypes.bool,
    children: PropTypes.node,
    costumeLibraryVisible: PropTypes.bool,
    costumesTabVisible: PropTypes.bool,
    enableCommunity: PropTypes.bool,
    isCreating: PropTypes.bool,
    isFullScreen: PropTypes.bool,
    isPlayerOnly: PropTypes.bool,
    isRtl: PropTypes.bool,
    isShared: PropTypes.bool,
    loading: PropTypes.bool,
    logo: PropTypes.string,
    manuallySaveThumbnails: PropTypes.bool,
    menuBarHidden: PropTypes.bool,
    onActivateCostumesTab: PropTypes.func,
    onActivateSoundsTab: PropTypes.func,
    onActivateTab: PropTypes.func,
    onClickAccountNav: PropTypes.func,
    onClickLogo: PropTypes.func,
    onCloseAccountNav: PropTypes.func,
    onExtensionButtonClick: PropTypes.func,
    onLogOut: PropTypes.func,
    onNewSpriteClick: PropTypes.func,
    onNewLibraryCostumeClick: PropTypes.func,
    onOpenRegistration: PropTypes.func,
    onRequestCloseBackdropLibrary: PropTypes.func,
    onRequestCloseCostumeLibrary: PropTypes.func,
    onRequestCloseSettingsModal: PropTypes.func,
    onRequestCloseTelemetryModal: PropTypes.func,
    onSeeCommunity: PropTypes.func,
    onShare: PropTypes.func,
    onShowPrivacyPolicy: PropTypes.func,
    onStartSelectingFileUpload: PropTypes.func,
    onTabSelect: PropTypes.func,
    onTelemetryModalCancel: PropTypes.func,
    onTelemetryModalOptIn: PropTypes.func,
    onTelemetryModalOptOut: PropTypes.func,
    onToggleLoginOpen: PropTypes.func,
    onUpdateProjectThumbnail: PropTypes.func,
    platform: PropTypes.oneOf(Object.keys(PLATFORM)),
    renderLogin: PropTypes.func,
    settingsModalVisible: PropTypes.bool,
    showComingSoon: PropTypes.bool,
    showNewFeatureCallouts: PropTypes.bool,
    soundsTabVisible: PropTypes.bool,
    stageSizeMode: PropTypes.oneOf(Object.keys(STAGE_SIZE_MODES)),
    setPlatform: PropTypes.func,
    targetIsStage: PropTypes.bool,
    telemetryModalVisible: PropTypes.bool,
    theme: PropTypes.string,
    useExternalPeripheralList: PropTypes.bool, // true for CDM, false for normal Scratch Link
    vm: PropTypes.instanceOf(VM).isRequired
};
GUIComponent.defaultProps = {
    backpackHost: null,
    backpackVisible: false,
    basePath: './',
    canChangeLanguage: true,
    canChangeTheme: true,
    canCreateNew: false,
    canEditTitle: false,
    canManageFiles: true,
    canRemix: false,
    canSave: false,
    canCreateCopy: false,
    canShare: false,
    canUseCloud: false,
    enableCommunity: false,
    isCreating: false,
    isShared: false,
    loading: false,
    menuBarHidden: false,
    showComingSoon: false,
    showNewFeatureCallouts: false,
    stageSizeMode: STAGE_SIZE_MODES.large,
    useExternalPeripheralList: false
};

const mapStateToProps = state => ({
    // This is the button's mode, as opposed to the actual current state
    theme: state.scratchGui.theme.theme,
    stageSizeMode: state.scratchGui.stageSize.stageSize,
    stageWidth: state.scratchGui.settings.stageWidth,
    stageHeight: state.scratchGui.settings.stageHeight
});

const mapDispatchToProps = dispatch => ({
    setPlatform: platform => dispatch(setPlatform(platform))
});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(GUIComponent);
