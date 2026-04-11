import classNames from 'classnames';
import omit from 'lodash.omit';
import React from 'react';
import {defineMessages, FormattedMessage, injectIntl} from 'react-intl';
import type {IntlShape} from 'react-intl';
import {connect} from 'react-redux';
import MediaQuery from 'react-responsive';
import {Tab, Tabs, TabList, TabPanel} from 'react-tabs';
import tabStyles from 'react-tabs/style/react-tabs.css';
import VM from 'clipcc-vm';
import Renderer from 'clipcc-render';

import Blocks from '../../containers/blocks';
import CostumeTab from '../../containers/costume-tab';
import TargetPane from '../../containers/target-pane';
import SoundTab from '../../containers/sound-tab';
import StageWrapper from '../../containers/stage-wrapper.jsx';
import Loader from '../loader/loader.jsx';
import Box from '../box/box.jsx';
import MenuBar from '../menu-bar/menu-bar';
import CostumeLibrary from '../../containers/costume-library.jsx';
import BackdropLibrary from '../../containers/backdrop-library.jsx';
import Watermark from '../../containers/watermark.jsx';

import Backpack from '../../containers/backpack';
import WebGlModal from '../../containers/webgl-modal.jsx';
import Alerts from '../../containers/alerts.jsx';
import DragLayer from '../../containers/drag-layer.jsx';
import ConnectionModal from '../../containers/connection-modal';
import TelemetryModal from '../telemetry-modal/telemetry-modal.jsx';
import SettingsModal from '../../containers/settings-modal.jsx';

import layout, {STAGE_SIZE_MODES} from '../../lib/layout-constants';
import {resolveStageSize} from '../../lib/screen-utils';
import {themeMap} from '../../lib/themes';

import styles from './gui.css';
import addExtensionIcon from './icon--extensions.svg';
import codeIcon from './icon--code.svg';
import costumesIcon from './icon--costumes.svg';
import soundsIcon from './icon--sounds.svg';
import type {RootState} from '../../lib/app-state-hoc';
import type {TabIndex} from '../../reducers/editor-tab';

const messages = defineMessages({
    addExtension: {
        id: 'gui.gui.addExtension',
        description: 'Button to add an extension in the target pane',
        defaultMessage: 'Add Extension'
    }
});

// Cache this value to only retrieve it once the first time.
// Assume that it doesn't change for a session.
let isRendererSupported: boolean | null = null;

export interface OwnProps {
    accountNavOpen?: boolean;
    activeTabIndex?: TabIndex;
    alertsVisible?: boolean;
    authorId?: string | boolean;
    authorThumbnailUrl?: string;
    authorUsername?: string | boolean;
    backdropLibraryVisible?: boolean;
    backpackHost?: string | null;
    backpackVisible?: boolean;
    basePath?: string;
    blocksTabVisible?: boolean;
    canChangeLanguage?: boolean;
    canChangeTheme?: boolean;
    canCreateCopy?: boolean;
    canCreateNew?: boolean;
    canEditTitle?: boolean;
    canManageFiles?: boolean;
    canRemix?: boolean;
    canSave?: boolean;
    canShare?: boolean;
    canUseCloud?: boolean;
    children?: React.ReactNode;
    connectionModalVisible?: boolean;
    costumeLibraryVisible?: boolean;
    costumesTabVisible?: boolean;
    enableCommunity?: boolean;
    intl: IntlShape;
    isCreating?: boolean;
    isFullScreen?: boolean;
    isPlayerOnly?: boolean;
    isRtl?: boolean;
    isShared?: boolean;
    isTelemetryEnabled?: boolean;
    loading?: boolean;
    logo?: string;
    onClickAbout?: () => void;
    onClickAccountNav?: () => void;
    onCloseAccountNav?: () => void;
    onLogOut?: () => void;
    onOpenRegistration?: () => void;
    onToggleLoginOpen?: () => void;
    onActivateCostumesTab?: () => void;
    onActivateSoundsTab?: () => void;
    onActivateTab?: (tab: TabIndex) => void;
    onClickLogo?: () => void;
    onExtensionButtonClick?: () => void;
    onProjectTelemetryEvent?: () => void;
    onRequestCloseBackdropLibrary?: () => void;
    onRequestCloseCostumeLibrary?: () => void;
    onRequestCloseTelemetryModal?: () => void;
    onSeeCommunity?: () => void;
    onShare?: () => void;
    onShowPrivacyPolicy?: () => void;
    onStartSelectingFileUpload?: () => void;
    onTelemetryModalCancel?: () => void;
    onTelemetryModalOptIn?: () => void;
    onTelemetryModalOptOut?: () => void;
    renderLogin?: () => React.ReactNode;
    settingsModalVisible?: boolean;
    showComingSoon?: boolean;
    soundsTabVisible?: boolean;
    stageSizeMode?: keyof typeof STAGE_SIZE_MODES;
    targetIsStage?: boolean;
    telemetryModalVisible?: boolean;
    theme?: keyof typeof themeMap;
    vm: VM;
    stageWidth?: number;
    stageHeight?: number;
}

const mapStateToProps = (state: RootState) => ({
    // This is the button's mode, as opposed to the actual current state
    theme: state.scratchGui.theme.theme,
    stageSizeMode: state.scratchGui.stageSize.stageSize,
    stageWidth: state.scratchGui.settings.stageWidth,
    stageHeight: state.scratchGui.settings.stageHeight
});

type StateProps = ReturnType<typeof mapStateToProps>;
type GUIProps = OwnProps & StateProps;

const GUIComponent = (props: GUIProps) => {
    const {
        accountNavOpen,
        activeTabIndex,
        alertsVisible,
        authorId,
        authorThumbnailUrl,
        authorUsername,
        basePath = './',
        backdropLibraryVisible,
        backpackHost = null,
        backpackVisible = false,
        blocksTabVisible,
        canChangeLanguage = true,
        canChangeTheme = true,
        canCreateNew = false,
        canEditTitle = false,
        canManageFiles = true,
        canRemix = false,
        canSave = false,
        canCreateCopy = false,
        canShare = false,
        canUseCloud = false,
        children,
        connectionModalVisible,
        costumeLibraryVisible,
        costumesTabVisible,
        enableCommunity = false,
        intl,
        isCreating = false,
        isFullScreen,
        isPlayerOnly,
        isRtl,
        isShared = false,
        isTelemetryEnabled,
        loading = false,
        logo,
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
        onProjectTelemetryEvent,
        onRequestCloseBackdropLibrary,
        onRequestCloseCostumeLibrary,
        onRequestCloseTelemetryModal,
        onSeeCommunity,
        onShare,
        onShowPrivacyPolicy,
        onStartSelectingFileUpload,
        onTelemetryModalCancel,
        onTelemetryModalOptIn,
        onTelemetryModalOptOut,
        settingsModalVisible,
        showComingSoon = false,
        soundsTabVisible,
        stageSizeMode = STAGE_SIZE_MODES.large,
        targetIsStage,
        telemetryModalVisible,
        theme,
        vm,
        stageWidth,
        stageHeight,
        ...componentProps
    } = omit(props, 'dispatch');

    if (children) {
        return <Box {...componentProps}>{children}</Box>;
    }

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

        return isPlayerOnly ? (
            <StageWrapper
                isFullScreen={isFullScreen}
                isRendererSupported={isRendererSupported}
                isRtl={isRtl}
                loading={loading}
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
                        // @ts-expect-error legacy jsx typing
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
                <MenuBar
                    // @ts-expect-error legacy jsx typing
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
                />
                <Box className={styles.bodyWrapper}>
                    <Box className={styles.flexWrapper}>
                        <Box className={styles.editorWrapper}>
                            <Tabs
                                forceRenderTabPanel
                                className={tabClassNames.tabs}
                                selectedIndex={activeTabIndex}
                                selectedTabClassName={tabClassNames.tabSelected}
                                selectedTabPanelClassName={tabClassNames.tabPanelSelected}
                                onSelect={onActivateTab as (index: number) => void}
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
                                    <Box className={styles.blocksWrapper}>
                                        <Blocks
                                            key={theme}
                                            // @ts-expect-error legacy jsx typing
                                            canUseCloud={canUseCloud}
                                            grow={1}
                                            isVisible={blocksTabVisible}
                                            options={{
                                                media: `${basePath}static/${themeMap[theme].blocksMediaFolder}/`
                                            }}
                                            stageSize={stageSize}
                                            theme={theme}
                                            vm={vm}
                                        />
                                    </Box>
                                    <Box className={styles.extensionButtonContainer}>
                                        <button
                                            className={styles.extensionButton}
                                            title={intl.formatMessage(messages.addExtension)}
                                            onClick={onExtensionButtonClick}
                                        >
                                            <img
                                                className={styles.extensionButtonIcon}
                                                draggable={false}
                                                src={addExtensionIcon}
                                            />
                                        </button>
                                    </Box>
                                    <Box className={styles.watermark}>
                                        <Watermark />
                                    </Box>
                                </TabPanel>
                                <TabPanel className={tabClassNames.tabPanel}>
                                    {costumesTabVisible ? (
                                        // @ts-expect-error legacy jsx typing
                                        <CostumeTab vm={vm} />
                                    ) : null}
                                </TabPanel>
                                <TabPanel className={tabClassNames.tabPanel}>
                                    {soundsTabVisible ? (
                                        // @ts-expect-error legacy jsx typing
                                        <SoundTab vm={vm} />
                                    ) : null}
                                </TabPanel>
                            </Tabs>
                            {backpackVisible ? (
                                // @ts-expect-error legacy jsx typing
                                <Backpack host={backpackHost} />
                            ) : null}
                        </Box>

                        <Box className={classNames(styles.stageAndTargetWrapper, styles[stageSize])}>
                            <StageWrapper
                                isFullScreen={isFullScreen}
                                isRendererSupported={isRendererSupported}
                                isRtl={isRtl}
                                stageSize={stageSize}
                                vm={vm}
                                stageWidth={stageWidth}
                                stageHeight={stageHeight}
                            />
                            <Box className={styles.targetWrapper}>
                                <TargetPane
                                    // @ts-expect-error legacy jsx typing
                                    stageSize={stageSize}
                                    vm={vm}
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

export default injectIntl(connect(
    mapStateToProps
)(GUIComponent));
