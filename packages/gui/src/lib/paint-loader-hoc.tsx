import React from 'react';
import {getScratchPaint} from './paint-loader';
import ScopedLoaderComponent from '../components/loader/scoped-loader';
import {injectReducer} from '../reducers/utils';

interface PaintLoaderProps {
    paint: typeof import('clipcc-paint');
}

export function injectPaint<Component extends React.ComponentType<PaintLoaderProps>> (WrappedComponent: Component) {
    class PaintLoaderHOC extends React.Component {
        state = {
            loaded: false
        };
        paint: typeof import('clipcc-paint') | null = null;

        override async componentDidMount () {
            if (!this.state.loaded) {
                this.paint = await getScratchPaint();
                // @ts-expect-error paint lack types
                injectReducer('scratchPaint', this.paint.ScratchPaintReducer);
                this.setState({loaded: true});
            }
        }

        override render () {
            if (!this.state.loaded) {
                return <ScopedLoaderComponent text="Loading paint..." />;
            }

            return <WrappedComponent {...this.props} paint={this.paint!} />;
        }
    }

    return PaintLoaderHOC;
}
