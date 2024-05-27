import React from 'react'
import styles from "./page.module.css"
import PlaylistItemsResults from './components/PlaylistItemsResults'
import NavSideBar from './components/NavSideBar'
import SelectSort from '../components/SelectSortInputs'

export async function generateMetadata() {

    return {
        title: `Watchlist | AniProject`,
        description: `User Watchlist.`,
    }
}

function PlaylistPage({ params, searchParams }: { params?: unknown, searchParams?: { format: string, sort: string } }) {

    return (
        <main id={styles.container}>

            <div id={styles.side_nav_container}>

                <NavSideBar params={searchParams} />

            </div>

            <section id={styles.main_content_container}>

                <div id={styles.heading_container}>

                    <h1>Watchlist</h1>

                    <SelectSort customSelectInputOptions={
                        [
                            { name: "From A to Z", value: "title_asc" },
                            { name: "From Z to A", value: "title_desc" },
                        ]
                    } />

                </div>

                <PlaylistItemsResults params={searchParams} />

            </section>

        </main>
    )
}

export default PlaylistPage