import React from 'react';
import {getScratchBlocks} from './blocks-loader';
import ScopedLoaderComponent from '../components/loader/scoped-loader';

interface BlockLoaderProps {
    blocks: typeof import('clipcc-block');
}

export function injectBlock<Component extends React.ComponentType<BlockLoaderProps>> (WrappedComponent: Component) {
    class BlockLoaderHOC extends React.Component {
        state = {
            loaded: false
        };
        blocks: typeof import('clipcc-block') | null = null;

        override async componentDidMount () {
            if (!this.state.loaded) {
                this.blocks = await getScratchBlocks();
                this.setState({loaded: true});
            }
        }

        override render () {
            if (!this.state.loaded) {
                return <ScopedLoaderComponent text="Loading blocks..." />;
            }

            return <WrappedComponent {...this.props} blocks={this.blocks!} />;
        }
    }

    return BlockLoaderHOC;
}
