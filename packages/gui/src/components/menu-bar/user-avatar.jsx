import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import defaultAvatar from './default-avatar.png';
import storage from '../../lib/storage';

import styles from './user-avatar.css';

const UserAvatar = ({
    className,
    imageUrl,
    rounded
}) => (
    <img
        className={classNames(
            className,
            styles.userThumbnail,
            {[styles.rounded]: rounded}
        )}
        src={imageUrl ? `${storage.projectHost}user/avatar/${imageUrl}` : defaultAvatar}
    />
);

UserAvatar.propTypes = {
    rounded: PropTypes.bool,
    className: PropTypes.string,
    imageUrl: PropTypes.string
};

export default UserAvatar;
