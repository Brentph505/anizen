"use client"
import React, { useEffect, useState } from 'react'
import styles from './component.module.css'
import PersonIcon from '@/public/assets/person-circle.svg'
import ChevronDownSvg from '@/public/assets/chevron-down.svg'
import ChevronUpSvg from '@/public/assets/chevron-up.svg'
import LogoutSvg from '@/public/assets/logout.svg'
import SettingsSvg from '@/public/assets/gear-fill.svg'
import HistorySvg from '@/public/assets/clock-history.svg'
import BookmarkSvg from '@/public/assets/bookmark-check-fill.svg'
import LoadingSvg from '@/public/assets/Eclipse-1s-200px.svg'
import { getAuth } from 'firebase/auth'
import { initFirebase } from "@/firebase/firebaseApp";
import { useAuthState } from "react-firebase-hooks/auth"
import Image from 'next/image'
import Link from 'next/link'
import UserModal from '../../../../components/UserLoginModal'
import { AnimatePresence, motion } from 'framer-motion'
import UserSettingsModal from '../UserSettingsModal'

function UserSideMenu() {

    const [isUserMenuOpen, setIsUserMenuOpen] = useState<boolean>(false)
    const [isUserSettingsOpen, setIsUserSettingsOpen] = useState<boolean>(false)

    // FIREBASE LOGIN 
    const app = initFirebase()
    const auth = getAuth()

    const [user, loading] = useAuthState(auth)

    const showUpMotion = {

        hidden: {
            y: "-40px",
            opacity: 0
        },
        visible: {
            y: "0",
            opacity: 1,
            transition: {
                duration: 0.2
            }
        },
        exit: {
            y: "-100px",
            opacity: 0,
            transition: {
                duration: 0.2
            }
        }

    }

    useEffect(() => {
        setIsUserMenuOpen(false)
    }, [user])

    return (
        <div id={styles.user_container}>

            {!user ? (
                <>
                    <button
                        onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                        aria-controls={styles.user_menu_list}
                        aria-label={isUserMenuOpen ? 'Click to Hide User Menu' : 'Click to Show User Menu'}
                        className={`display_flex_row align_items_center ${styles.heading_btn}`}
                        id={styles.user_btn}
                        data-useractive={false}
                        data-loading={loading}
                    >
                        {loading ? (
                            <LoadingSvg width={16} height={16} title="Loading" />
                        ) : (
                            <>
                                <PersonIcon className={styles.scale} alt="User Icon" width={16} height={16} />
                                <span>
                                    Login
                                </span>
                            </>
                        )}
                    </button>

                    <AnimatePresence
                        initial={false}
                        mode='wait'
                    >
                        {isUserMenuOpen && (

                            <UserModal
                                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                auth={auth}
                                aria-expanded={isUserMenuOpen}
                            />

                        )}

                    </AnimatePresence>
                </>
            ) : (
                <>
                    <button
                        onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                        aria-controls={styles.user_menu_list}
                        aria-label={isUserMenuOpen ? 'Click to Hide User Menu' : 'Click to Show User Menu'}
                        className={`display_flex_row align_items_center ${styles.heading_btn}`}
                        id={styles.user_btn}
                        data-useractive={true}
                    >
                        <span id={styles.img_container}>
                            <Image
                                src={user.photoURL as string}
                                fill
                                sizes='100%'
                                alt={user.displayName as string}>
                            </Image>
                        </span>
                        <span>
                            {!isUserMenuOpen ?
                                <ChevronDownSvg /> : <ChevronUpSvg />
                            }
                        </span>
                    </button>

                    <AnimatePresence
                        initial={false}
                        mode='wait'
                    >
                        {isUserMenuOpen && (
                            <motion.div
                                variants={showUpMotion}
                                id={styles.user_menu_list}
                                aria-expanded={isUserMenuOpen}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                            >

                                <ul role='menu'>
                                    <li role='menuitem' onClick={() => setIsUserMenuOpen(false)}>
                                        <Link href={"/watchlist"}>
                                            <BookmarkSvg width={16} height={16} alt={"Watchlist Icon"} /> Watchlist
                                        </Link>
                                    </li>
                                    {/* 
                                        <li role='menuitem' onClick={() => setIsUserMenuOpen(false)}>
                                            <Link href={"/history"}>
                                                <HistorySvg width={16} height={16} alt={"History Icon"} /> History
                                            </Link>
                                        </li>
                                    */}
                                    <li role='menuitem' onClick={() => setIsUserMenuOpen(false)}>
                                        <button onClick={() => setIsUserSettingsOpen(true)}>
                                            <SettingsSvg width={16} height={16} alt={"Settings Icon"} /> Settings
                                        </button>
                                    </li>
                                    <li role='menuitem' onClick={() => setIsUserMenuOpen(false)}>
                                        <button onClick={() => auth.signOut()}>
                                            <LogoutSvg width={16} height={16} alt={"Logout Icon"} /> Log Out
                                        </button>
                                    </li>
                                </ul>

                            </motion.div>
                        )}


                        {isUserSettingsOpen && (

                            <UserSettingsModal
                                onClick={() => setIsUserSettingsOpen(!isUserSettingsOpen)}
                                auth={auth}
                                aria-expanded={isUserSettingsOpen}
                            />

                        )}

                    </AnimatePresence>
                </>
            )}
        </div>

    )
}

export default UserSideMenu