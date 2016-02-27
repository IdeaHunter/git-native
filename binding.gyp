{
  'targets': [
    {
      'target_name': 'git',
      'win_delay_load_hook': 'false',
      'dependencies': [
        'libgit2'
      ],
      'include_dirs': [ '<!(node -e "require(\'nan\')")' ],
      'sources': [
        'src/repository.cc',
        'src/git-worker.cc'
      ],
      'cflags': ['-fexceptions'],
      'cflags_cc': ['-fexceptions'],
      'conditions': [
        ['OS=="win"', {
          'msvs_disabled_warnings': [
            4244,  # conversion from 'ssize_t' to 'int32_t', possible loss of data
            4530,  # C++ exception handler used, but unwind semantics are not enabled.
            4506,  # no definition for inline function
            4267,  # conversion from 'size_t' to 'int', possible loss of data
            4344,  # behavior change
          ],
        }, {
          'cflags': [
            '-Wno-missing-field-initializers',
          ],
          'xcode_settings': {
            'WARNING_CFLAGS': [
              '-Wno-missing-field-initializers',
            ],
          },
        }],
      ],
    },
    {
      'target_name': 'libgit2',
      'win_delay_load_hook': 'false',
      'type': 'static_library',
      'defines': [
        'GIT_THREADS',
        # Node's util.h may be accidentally included so use this to guard
        # against compilation error.
        'SRC_UTIL_H_',
      ],
      'dependencies': [
        'zlib',
        'http_parser',
      ],
      'sources': [
        'deps/libgit2/src/annotated_commit.c',
        'deps/libgit2/src/annotated_commit.h',
        'deps/libgit2/src/array.h',
        'deps/libgit2/src/attr.c',
        'deps/libgit2/src/attr.h',
        'deps/libgit2/src/attr_file.c',
        'deps/libgit2/src/attr_file.h',
        'deps/libgit2/src/attrcache.c',
        'deps/libgit2/src/attrcache.h',
        'deps/libgit2/src/bitvec.h',
        'deps/libgit2/src/blame.c',
        'deps/libgit2/src/blame.h',
        'deps/libgit2/src/blame_git.c',
        'deps/libgit2/src/blame_git.h',
        'deps/libgit2/src/blob.c',
        'deps/libgit2/src/blob.h',
        'deps/libgit2/src/branch.c',
        'deps/libgit2/src/branch.h',
        'deps/libgit2/src/buf_text.c',
        'deps/libgit2/src/buf_text.h',
        'deps/libgit2/src/buffer.c',
        'deps/libgit2/src/buffer.h',
        'deps/libgit2/src/cache.c',
        'deps/libgit2/src/cache.h',
        'deps/libgit2/src/cc-compat.h',
        'deps/libgit2/src/checkout.c',
        'deps/libgit2/src/checkout.h',
        'deps/libgit2/src/cherrypick.c',
        'deps/libgit2/src/clone.c',
        'deps/libgit2/src/clone.h',
        'deps/libgit2/src/commit.c',
        'deps/libgit2/src/commit.h',
        'deps/libgit2/src/commit_list.c',
        'deps/libgit2/src/commit_list.h',
        'deps/libgit2/src/common.h',
        'deps/libgit2/src/config.c',
        'deps/libgit2/src/config.h',
        'deps/libgit2/src/config_cache.c',
        'deps/libgit2/src/config_file.c',
        'deps/libgit2/src/config_file.h',
        'deps/libgit2/src/crlf.c',
        'deps/libgit2/src/curl_stream.c',
        'deps/libgit2/src/curl_stream.h',
        'deps/libgit2/src/date.c',
        'deps/libgit2/src/delta-apply.c',
        'deps/libgit2/src/delta-apply.h',
        'deps/libgit2/src/delta.c',
        'deps/libgit2/src/delta.h',
        'deps/libgit2/src/describe.c',
        'deps/libgit2/src/diff.c',
        'deps/libgit2/src/diff.h',
        'deps/libgit2/src/diff_driver.c',
        'deps/libgit2/src/diff_driver.h',
        'deps/libgit2/src/diff_file.c',
        'deps/libgit2/src/diff_file.h',
        'deps/libgit2/src/diff_patch.c',
        'deps/libgit2/src/diff_patch.h',
        'deps/libgit2/src/diff_print.c',
        'deps/libgit2/src/diff_stats.c',
        'deps/libgit2/src/diff_tform.c',
        'deps/libgit2/src/diff_xdiff.c',
        'deps/libgit2/src/diff_xdiff.h',
        'deps/libgit2/src/errors.c',
        'deps/libgit2/src/fetch.c',
        'deps/libgit2/src/fetch.h',
        'deps/libgit2/src/fetchhead.c',
        'deps/libgit2/src/fetchhead.h',
        'deps/libgit2/src/filebuf.c',
        'deps/libgit2/src/filebuf.h',
        'deps/libgit2/src/fileops.c',
        'deps/libgit2/src/fileops.h',
        'deps/libgit2/src/filter.c',
        'deps/libgit2/src/filter.h',
        'deps/libgit2/src/fnmatch.c',
        'deps/libgit2/src/fnmatch.h',
        'deps/libgit2/src/global.c',
        'deps/libgit2/src/global.h',
        'deps/libgit2/src/graph.c',
        'deps/libgit2/src/hash.c',
        'deps/libgit2/src/hash.h',
        'deps/libgit2/src/hashsig.c',
        'deps/libgit2/src/ident.c',
        'deps/libgit2/src/ignore.c',
        'deps/libgit2/src/ignore.h',
        'deps/libgit2/src/index.c',
        'deps/libgit2/src/index.h',
        'deps/libgit2/src/indexer.c',
        'deps/libgit2/src/integer.h',
        'deps/libgit2/src/iterator.c',
        'deps/libgit2/src/iterator.h',
        'deps/libgit2/src/khash.h',
        'deps/libgit2/src/map.h',
        'deps/libgit2/src/merge.c',
        'deps/libgit2/src/merge.h',
        'deps/libgit2/src/merge_file.c',
        'deps/libgit2/src/message.c',
        'deps/libgit2/src/message.h',
        'deps/libgit2/src/mwindow.c',
        'deps/libgit2/src/mwindow.h',
        'deps/libgit2/src/netops.c',
        'deps/libgit2/src/netops.h',
        'deps/libgit2/src/notes.c',
        'deps/libgit2/src/notes.h',
        'deps/libgit2/src/object.c',
        'deps/libgit2/src/object.h',
        'deps/libgit2/src/object_api.c',
        'deps/libgit2/src/odb.c',
        'deps/libgit2/src/odb.h',
        'deps/libgit2/src/odb_loose.c',
        'deps/libgit2/src/odb_mempack.c',
        'deps/libgit2/src/odb_pack.c',
        'deps/libgit2/src/offmap.h',
        'deps/libgit2/src/oid.c',
        'deps/libgit2/src/oid.h',
        'deps/libgit2/src/oidarray.c',
        'deps/libgit2/src/oidarray.h',
        'deps/libgit2/src/oidmap.h',
        'deps/libgit2/src/openssl_stream.c',
        'deps/libgit2/src/openssl_stream.h',
        'deps/libgit2/src/pack-objects.c',
        'deps/libgit2/src/pack-objects.h',
        'deps/libgit2/src/pack.c',
        'deps/libgit2/src/pack.h',
        'deps/libgit2/src/path.c',
        'deps/libgit2/src/path.h',
        'deps/libgit2/src/pathspec.c',
        'deps/libgit2/src/pathspec.h',
        'deps/libgit2/src/pool.c',
        'deps/libgit2/src/pool.h',
        'deps/libgit2/src/posix.c',
        'deps/libgit2/src/posix.h',
        'deps/libgit2/src/pqueue.c',
        'deps/libgit2/src/pqueue.h',
        'deps/libgit2/src/push.c',
        'deps/libgit2/src/push.h',
        'deps/libgit2/src/rebase.c',
        'deps/libgit2/src/refdb.c',
        'deps/libgit2/src/refdb.h',
        'deps/libgit2/src/refdb_fs.c',
        'deps/libgit2/src/refdb_fs.h',
        'deps/libgit2/src/reflog.c',
        'deps/libgit2/src/reflog.h',
        'deps/libgit2/src/refs.c',
        'deps/libgit2/src/refs.h',
        'deps/libgit2/src/refspec.c',
        'deps/libgit2/src/refspec.h',
        'deps/libgit2/src/remote.c',
        'deps/libgit2/src/remote.h',
        'deps/libgit2/src/repo_template.h',
        'deps/libgit2/src/repository.c',
        'deps/libgit2/src/repository.h',
        'deps/libgit2/src/reset.c',
        'deps/libgit2/src/revert.c',
        'deps/libgit2/src/revparse.c',
        'deps/libgit2/src/revwalk.c',
        'deps/libgit2/src/revwalk.h',
        'deps/libgit2/src/settings.c',
        'deps/libgit2/src/sha1_lookup.c',
        'deps/libgit2/src/sha1_lookup.h',
        'deps/libgit2/src/signature.c',
        'deps/libgit2/src/signature.h',
        'deps/libgit2/src/socket_stream.c',
        'deps/libgit2/src/socket_stream.h',
        'deps/libgit2/src/sortedcache.c',
        'deps/libgit2/src/sortedcache.h',
        'deps/libgit2/src/stash.c',
        'deps/libgit2/src/status.c',
        'deps/libgit2/src/status.h',
        'deps/libgit2/src/stransport_stream.c',
        'deps/libgit2/src/stransport_stream.h',
        'deps/libgit2/src/stream.h',
        'deps/libgit2/src/strmap.c',
        'deps/libgit2/src/strmap.h',
        'deps/libgit2/src/strnlen.h',
        'deps/libgit2/src/submodule.c',
        'deps/libgit2/src/submodule.h',
        'deps/libgit2/src/sysdir.c',
        'deps/libgit2/src/sysdir.h',
        'deps/libgit2/src/tag.c',
        'deps/libgit2/src/tag.h',
        'deps/libgit2/src/thread-utils.c',
        'deps/libgit2/src/thread-utils.h',
        'deps/libgit2/src/tls_stream.c',
        'deps/libgit2/src/tls_stream.h',
        'deps/libgit2/src/trace.c',
        'deps/libgit2/src/trace.h',
        'deps/libgit2/src/transaction.c',
        'deps/libgit2/src/transaction.h',
        'deps/libgit2/src/transport.c',
        'deps/libgit2/src/tree-cache.c',
        'deps/libgit2/src/tree-cache.h',
        'deps/libgit2/src/tree.c',
        'deps/libgit2/src/tree.h',
        'deps/libgit2/src/tsort.c',
        'deps/libgit2/src/userdiff.h',
        'deps/libgit2/src/util.c',
        'deps/libgit2/src/util.h',
        'deps/libgit2/src/vector.c',
        'deps/libgit2/src/vector.h',
        'deps/libgit2/src/zstream.c',
        'deps/libgit2/src/zstream.h',
        'deps/libgit2/src/transports/auth.c',
        'deps/libgit2/src/transports/auth_negotiate.c',
        'deps/libgit2/src/transports/cred.c',
        'deps/libgit2/src/transports/cred_helpers.c',
        'deps/libgit2/src/transports/git.c',
        'deps/libgit2/src/transports/http.c',
        'deps/libgit2/src/transports/local.c',
        'deps/libgit2/src/transports/smart.c',
        'deps/libgit2/src/transports/smart.h',
        'deps/libgit2/src/transports/smart_pkt.c',
        'deps/libgit2/src/transports/smart_protocol.c',
        'deps/libgit2/src/transports/ssh.c',
        'deps/libgit2/src/transports/winhttp.c',
        'deps/libgit2/src/xdiff/xdiff.h',
        'deps/libgit2/src/xdiff/xdiffi.c',
        'deps/libgit2/src/xdiff/xdiffi.h',
        'deps/libgit2/src/xdiff/xemit.c',
        'deps/libgit2/src/xdiff/xemit.h',
        'deps/libgit2/src/xdiff/xhistogram.c',
        'deps/libgit2/src/xdiff/xinclude.h',
        'deps/libgit2/src/xdiff/xmacros.h',
        'deps/libgit2/src/xdiff/xmerge.c',
        'deps/libgit2/src/xdiff/xpatience.c',
        'deps/libgit2/src/xdiff/xprepare.c',
        'deps/libgit2/src/xdiff/xprepare.h',
        'deps/libgit2/src/xdiff/xtypes.h',
        'deps/libgit2/src/xdiff/xutils.c',
        'deps/libgit2/src/xdiff/xutils.h',
        'deps/libgit2/src/hash/hash_generic.c',
        'deps/libgit2/src/hash/hash_generic.h',
        'deps/libgit2/src/hash/hash_openssl.h',
      ],
      'conditions': [
        ['OS=="linux"', {
          'cflags': [
            '-w',
          ],
        }],
        ['OS=="win"', {
          'defines': [
            'GIT_WINHTTP',
          ],
          'include_dirs': [
            'deps/libgit2/deps/regex',
          ],
          'link_settings': {
            'libraries': [
              '-lcrypt32.lib',
              '-lrpcrt4.lib',
              '-lwinhttp.lib',
              '-lws2_32.lib',
            ],
          },
          'msvs_settings': {
            # Workaround of a strange bug:
            # TargetMachine + static_library + x64 = nothing.
            'conditions': [
              ['target_arch=="x64"', {
                'VCLibrarianTool': {
                  'AdditionalOptions': [
                    '/MACHINE:X64',
                  ],
                },
              }, {
                'VCLibrarianTool': {
                  'AdditionalOptions': [
                    '/MACHINE:x86',
                  ],
                },
              }],
            ],
          },
          'msvs_disabled_warnings': [
            4005,  # macro redefinition
            4244,  # conversion from 'ssize_t' to 'int32_t', possible loss of data
            4267,  # conversion from 'size_t' to 'int', possible loss of data
            4090,  # different 'volatile' qualifiers
            4047,  # 'volatile void *' differs in levels of indirection from 'int'
            4013,  # 'InterlockedDecrement' undefined; assuming extern returning int
          ],
          'sources': [
            'deps/libgit2/src/win32/dir.c',
            'deps/libgit2/src/win32/dir.h',
            'deps/libgit2/src/win32/error.c',
            'deps/libgit2/src/win32/error.h',
            'deps/libgit2/src/win32/findfile.c',
            'deps/libgit2/src/win32/findfile.h',
            'deps/libgit2/src/win32/git2.rc',
            'deps/libgit2/src/win32/map.c',
            'deps/libgit2/src/win32/mingw-compat.h',
            'deps/libgit2/src/win32/msvc-compat.h',
            'deps/libgit2/src/win32/path_w32.c',
            'deps/libgit2/src/win32/path_w32.h',
            'deps/libgit2/src/win32/posix.h',
            'deps/libgit2/src/win32/posix_w32.c',
            'deps/libgit2/src/win32/precompiled.c',
            'deps/libgit2/src/win32/precompiled.h',
            'deps/libgit2/src/win32/pthread.c',
            'deps/libgit2/src/win32/pthread.h',
            'deps/libgit2/src/win32/reparse.h',
            'deps/libgit2/src/win32/utf-conv.c',
            'deps/libgit2/src/win32/utf-conv.h',
            'deps/libgit2/src/win32/version.h',
            'deps/libgit2/src/win32/w32_buffer.c',
            'deps/libgit2/src/win32/w32_buffer.h',
            'deps/libgit2/src/win32/w32_crtdbg_stacktrace.c',
            'deps/libgit2/src/win32/w32_crtdbg_stacktrace.h',
            'deps/libgit2/src/win32/w32_stack.c',
            'deps/libgit2/src/win32/w32_stack.h',
            'deps/libgit2/src/win32/w32_util.c',
            'deps/libgit2/src/win32/w32_util.h',
            'deps/libgit2/deps/regex/regex.c',
          ],
        }, {
          'libraries': [
            '-lpthread',
          ],
          'sources': [
            'deps/libgit2/src/unix/map.c',
            'deps/libgit2/src/unix/posix.h',
            'deps/libgit2/src/unix/realpath.c',
          ],
          'cflags': [
            '-Wno-missing-field-initializers',
            '-Wno-unused-variable',
            '-Wno-unused-function',
          ],
          'xcode_settings': {
            'WARNING_CFLAGS': [
              '-Wno-missing-field-initializers',
              '-Wno-unused-variable',
              '-Wno-unused-function',
            ],
          },
        }],
      ],
      'include_dirs': [
        'deps/libgit2/include',
        'deps/libgit2/src',
      ],
      'direct_dependent_settings': {
        'include_dirs': [
          'deps/libgit2/include',
        ],
      },
    },
    {
      'target_name': 'zlib',
      'win_delay_load_hook': 'false',
      'type': 'static_library',
      'sources': [
        'deps/libgit2/deps/zlib/adler32.c',
        'deps/libgit2/deps/zlib/crc32.c',
        'deps/libgit2/deps/zlib/crc32.h',
        'deps/libgit2/deps/zlib/deflate.c',
        'deps/libgit2/deps/zlib/deflate.h',
        'deps/libgit2/deps/zlib/inffast.c',
        'deps/libgit2/deps/zlib/inffast.h',
        'deps/libgit2/deps/zlib/inffixed.h',
        'deps/libgit2/deps/zlib/inflate.c',
        'deps/libgit2/deps/zlib/inflate.h',
        'deps/libgit2/deps/zlib/inftrees.c',
        'deps/libgit2/deps/zlib/inftrees.h',
        'deps/libgit2/deps/zlib/trees.c',
        'deps/libgit2/deps/zlib/trees.h',
        'deps/libgit2/deps/zlib/zconf.h',
        'deps/libgit2/deps/zlib/zlib.h',
        'deps/libgit2/deps/zlib/zutil.c',
        'deps/libgit2/deps/zlib/zutil.h',
      ],
      'defines': [
        'NO_VIZ',
        'STDC',
        'NO_GZIP',
      ],
      'include_dirs': [
        'deps/libgit2/include',
      ],
      'direct_dependent_settings': {
        'include_dirs': [
          'deps/libgit2/deps/zlib',
        ],
      },
      'conditions': [
        ['OS=="win"', {
          'msvs_disabled_warnings': [
            4005,  # macro redefinition
          ],
          'include_dirs': [
            'deps/libgit2/deps/regex',
          ],
        }],
      ],
    },
    {
      'target_name': 'http_parser',
      'win_delay_load_hook': 'false',
      'type': 'static_library',
      'sources': [
        'deps/libgit2/deps/http-parser/http_parser.c',
        'deps/libgit2/deps/http-parser/http_parser.h',
      ],
      'direct_dependent_settings': {
        'include_dirs': [
          'deps/libgit2/deps/http-parser',
        ],
      },
      'conditions': [
        ['OS=="win"', {
          'msvs_disabled_warnings': [
            4244,  # conversion from 'ssize_t' to 'int32_t', possible loss of data
          ],
        }],
      ],
    },
  ],
}
